#!/usr/bin/env bash
# send-erc8021.sh — periodically send ERC-8021 attributed transactions on X Layer
# Requires: python3, curl (no other dependencies)

set -euo pipefail

# ── chain defaults ─────────────────────────────────────────────────────────────
TESTNET_CHAIN_ID=1952
TESTNET_RPC="https://testrpc.xlayer.tech/terigon"
MAINNET_CHAIN_ID=196
MAINNET_RPC="https://rpc.xlayer.tech"

ERC_SUFFIX="80218021802180218021802180218021"   # ERC-8021 magic (16 bytes)

# ── defaults ───────────────────────────────────────────────────────────────────
NETWORK="testnet"
INTERVAL=60
PRIVATE_KEY=""
BUILDER_CODE=""
CUSTOM_RPC=""

# ── usage ──────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Required:
  -k, --key      <private_key>       Sender private key (0x-prefixed)
  -b, --builder  <builder_code>      X Layer Builder Code string

Optional:
  -n, --network  <testnet|mainnet>   Network to use (default: testnet)
  -r, --rpc      <url>               Override RPC endpoint
  -i, --interval <seconds>           Seconds between sends (default: 60)
  -h, --help                         Show this help

Examples:
  $(basename "$0") -k 0xabc... -b YOUR-BUILDER-CODE
  $(basename "$0") -k 0xabc... -b YOUR-BUILDER-CODE -n mainnet
  $(basename "$0") -k 0xabc... -b YOUR-BUILDER-CODE -r https://my-rpc.example.com -i 30
EOF
  exit 1
}

# ── arg parsing ────────────────────────────────────────────────────────────────
[[ $# -eq 0 ]] && usage

while [[ $# -gt 0 ]]; do
  case $1 in
    -k|--key)      PRIVATE_KEY="$2";   shift 2 ;;
    -b|--builder)  BUILDER_CODE="$2";  shift 2 ;;
    -n|--network)  NETWORK="$2";       shift 2 ;;
    -r|--rpc)      CUSTOM_RPC="$2";    shift 2 ;;
    -i|--interval) INTERVAL="$2";      shift 2 ;;
    -h|--help)     usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[[ -z "$PRIVATE_KEY"  ]] && { echo "Error: --key is required";     usage; }
[[ -z "$BUILDER_CODE" ]] && { echo "Error: --builder is required";  usage; }

command -v python3 &>/dev/null || { echo "Error: python3 not found"; exit 1; }
command -v curl    &>/dev/null || { echo "Error: curl not found";    exit 1; }

# ── resolve network ────────────────────────────────────────────────────────────
case "$NETWORK" in
  testnet)
    CHAIN_ID=$TESTNET_CHAIN_ID
    RPC="${CUSTOM_RPC:-$TESTNET_RPC}"
    EXPLORER="https://www.okx.com/web3/explorer/xlayer-test/tx"
    ;;
  mainnet)
    CHAIN_ID=$MAINNET_CHAIN_ID
    RPC="${CUSTOM_RPC:-$MAINNET_RPC}"
    EXPLORER="https://www.okx.com/web3/explorer/xlayer/tx"
    ;;
  *)
    echo "Error: --network must be 'testnet' or 'mainnet'"
    exit 1
    ;;
esac

# ── all crypto + RPC work done in one Python helper ───────────────────────────
# Uses only the Python standard library (no pip installs needed)
PYTHON_HELPER='
import sys, json, os, hashlib, hmac, struct, time
from urllib.request import urlopen, Request
from urllib.error import URLError

# ── secp256k1 (pure Python, stdlib only) ──────────────────────────────────────
P  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
N  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
G  = (Gx, Gy)

def modinv(a, m=P):
    return pow(a, m - 2, m)

def point_add(P1, P2):
    if P1 is None: return P2
    if P2 is None: return P1
    if P1[0] == P2[0]:
        if P1[1] != P2[1]: return None
        lam = (3 * P1[0] * P1[0] * modinv(2 * P1[1])) % P
    else:
        lam = ((P2[1] - P1[1]) * modinv(P2[0] - P1[0])) % P
    x = (lam * lam - P1[0] - P2[0]) % P
    y = (lam * (P1[0] - x) - P1[1]) % P
    return (x, y)

def point_mul(k, pt):
    result = None
    addend = pt
    while k:
        if k & 1:
            result = point_add(result, addend)
        addend = point_add(addend, addend)
        k >>= 1
    return result

def privkey_to_pubkey(priv_int):
    return point_mul(priv_int, G)

def pubkey_to_address(pub):
    x, y = pub
    raw = x.to_bytes(32, "big") + y.to_bytes(32, "big")
    h = hashlib.new("sha3_256") if False else __import__("hashlib").new("sha3_256")
    # keccak256 — use sha3_256 trick? No: need real keccak. Use pysha3 if available,
    # else fall back to a pure-python implementation bundled inline below.
    return keccak256(raw)[-20:]

# ── keccak256 (pure Python) ───────────────────────────────────────────────────
# RC constants and rotation offsets from the Keccak spec
_RC = [
    0x0000000000000001,0x0000000000008082,0x800000000000808A,0x8000000080008000,
    0x000000000000808B,0x0000000080000001,0x8000000080008081,0x8000000000008009,
    0x000000000000008A,0x0000000000000088,0x0000000080008009,0x000000008000000A,
    0x000000008000808B,0x800000000000008B,0x8000000000008089,0x8000000000008003,
    0x8000000000008002,0x8000000000000080,0x000000000000800A,0x800000008000000A,
    0x8000000080008081,0x8000000000008080,0x0000000080000001,0x8000000080008008,
]
_ROT = [
    [0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]
]

def _keccak_f(A):
    for rc in _RC:
        C = [A[x][0]^A[x][1]^A[x][2]^A[x][3]^A[x][4] for x in range(5)]
        D = [C[(x-1)%5]^((C[(x+1)%5]<<1|(C[(x+1)%5]>>63))&0xFFFFFFFFFFFFFFFF) for x in range(5)]
        A = [[A[x][y]^D[x] for y in range(5)] for x in range(5)]
        B = [[0]*5 for _ in range(5)]
        for x in range(5):
            for y in range(5):
                r = _ROT[x][y]
                v = A[x][y]
                B[y][(2*x+3*y)%5] = ((v<<r)|(v>>(64-r)))&0xFFFFFFFFFFFFFFFF
        A = [[(B[x][y]^((~B[(x+1)%5][y])&B[(x+2)%5][y]))&0xFFFFFFFFFFFFFFFF for y in range(5)] for x in range(5)]
        A[0][0] ^= rc
    return A

def keccak256(data: bytes) -> bytes:
    rate = 136  # 1088 bits / 8
    msg = bytearray(data)
    msg.append(0x01)
    while len(msg) % rate != 0:
        msg.append(0x00)
    msg[-1] |= 0x80
    A = [[0]*5 for _ in range(5)]
    for i in range(0, len(msg), rate):
        block = msg[i:i+rate]
        for j in range(rate//8):
            x, y = j%5, j//5
            A[x][y] ^= int.from_bytes(block[j*8:(j+1)*8], "little")
        A = _keccak_f(A)
    out = b""
    for j in range(4):
        x, y = j%5, j//5
        out += A[x][y].to_bytes(8, "little")
    return out

# ── RFC-6979 deterministic k ──────────────────────────────────────────────────
def _bits2int(b):
    v = int.from_bytes(b, "big")
    vlen = len(b) * 8
    if vlen > 256:
        v >>= (vlen - 256)
    return v

def _int2octets(x):
    return x.to_bytes(32, "big")

def _bits2octets(b):
    z = _bits2int(b) % N
    return _int2octets(z)

def rfc6979_k(priv_bytes, msg_hash):
    h1 = msg_hash
    V = b"\x01" * 32
    K = b"\x00" * 32
    K = hmac.new(K, V + b"\x00" + priv_bytes + _bits2octets(h1), hashlib.sha256).digest()
    V = hmac.new(K, V, hashlib.sha256).digest()
    K = hmac.new(K, V + b"\x01" + priv_bytes + _bits2octets(h1), hashlib.sha256).digest()
    V = hmac.new(K, V, hashlib.sha256).digest()
    while True:
        V = hmac.new(K, V, hashlib.sha256).digest()
        k = _bits2int(V)
        if 1 <= k < N:
            return k
        K = hmac.new(K, V + b"\x00", hashlib.sha256).digest()
        V = hmac.new(K, V, hashlib.sha256).digest()

# ── ECDSA sign ────────────────────────────────────────────────────────────────
def ecdsa_sign(priv_int, msg_hash_bytes):
    z = int.from_bytes(msg_hash_bytes, "big")
    priv_bytes = priv_int.to_bytes(32, "big")
    k = rfc6979_k(priv_bytes, msg_hash_bytes)
    R = point_mul(k, G)
    r = R[0] % N
    s = (modinv(k, N) * (z + r * priv_int)) % N
    v = R[1] & 1
    # Enforce low-s (EIP-2) — flipping s also flips the recovery bit
    if s > N // 2:
        s = N - s
        v ^= 1
    return r, s, v

# ── EIP-155 transaction signing ───────────────────────────────────────────────
def rlp_encode(item):
    if isinstance(item, (bytes, bytearray)):
        b = bytes(item)
        if len(b) == 1 and b[0] < 0x80:
            return b
        prefix = rlp_length_prefix(len(b), 0x80)
        return prefix + b
    elif isinstance(item, list):
        encoded = b"".join(rlp_encode(i) for i in item)
        prefix = rlp_length_prefix(len(encoded), 0xC0)
        return prefix + encoded

def rlp_length_prefix(length, offset):
    if length < 56:
        return bytes([offset + length])
    len_bytes = length.to_bytes((length.bit_length() + 7) // 8, "big")
    return bytes([offset + 55 + len(len_bytes)]) + len_bytes

def int_to_bytes(n):
    if n == 0:
        return b""
    return n.to_bytes((n.bit_length() + 7) // 8, "big")

def sign_tx(priv_int, to_addr_hex, data_hex, nonce, gas_price, gas_limit, value, chain_id):
    to_bytes_val  = bytes.fromhex(to_addr_hex[2:] if to_addr_hex.startswith("0x") else to_addr_hex)
    data_bytes    = bytes.fromhex(data_hex[2:] if data_hex.startswith("0x") else data_hex)

    # RLP encode for signing: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
    raw_for_hash = rlp_encode([
        int_to_bytes(nonce),
        int_to_bytes(gas_price),
        int_to_bytes(gas_limit),
        to_bytes_val,
        int_to_bytes(value),
        data_bytes,
        int_to_bytes(chain_id),
        b"",
        b"",
    ])
    msg_hash = keccak256(raw_for_hash)

    r, s, parity = ecdsa_sign(priv_int, msg_hash)
    v = chain_id * 2 + 35 + parity

    signed = rlp_encode([
        int_to_bytes(nonce),
        int_to_bytes(gas_price),
        int_to_bytes(gas_limit),
        to_bytes_val,
        int_to_bytes(value),
        data_bytes,
        int_to_bytes(v),
        int_to_bytes(r),
        int_to_bytes(s),
    ])
    return "0x" + signed.hex()

# ── RPC helpers ───────────────────────────────────────────────────────────────
def rpc(url, method, params):
    payload = json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode()
    req = Request(url, data=payload, headers={"Content-Type":"application/json"})
    with urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())

def eth_get_nonce(rpc_url, address):
    res = rpc(rpc_url, "eth_getTransactionCount", [address, "pending"])
    return int(res["result"], 16)

def eth_gas_price(rpc_url):
    res = rpc(rpc_url, "eth_gasPrice", [])
    return int(res["result"], 16)

def eth_get_balance(rpc_url, address):
    res = rpc(rpc_url, "eth_getBalance", [address, "latest"])
    return int(res["result"], 16)

def eth_send_raw(rpc_url, raw_tx):
    res = rpc(rpc_url, "eth_sendRawTransaction", [raw_tx])
    if "error" in res:
        raise RuntimeError(res["error"]["message"])
    return res["result"]

# ── ERC-8021 Schema 0 data suffix ────────────────────────────────────────────
# codes_ascii ∥ codes_len (1 byte) ∥ schema_id=0x00 (1 byte) ∥ ercSuffix (16 bytes)
def make_data_suffix(builder_code, erc_sfx):
    code_bytes = builder_code.encode("ascii")
    code_hex   = code_bytes.hex()
    code_len   = len(code_bytes)
    return "0x" + code_hex + format(code_len, "02x") + "00" + erc_sfx

# ── main ──────────────────────────────────────────────────────────────────────
def main():
    priv_hex, builder_code, erc_sfx, rpc_url, chain_id_str, explorer, interval_str = sys.argv[1:]
    chain_id = int(chain_id_str)
    interval = int(interval_str)

    priv_hex_clean = priv_hex[2:] if priv_hex.startswith("0x") else priv_hex
    priv_int = int(priv_hex_clean, 16)
    pub = privkey_to_pubkey(priv_int)
    addr_bytes = pubkey_to_address(pub)
    address = "0x" + addr_bytes.hex()

    data_suffix = make_data_suffix(builder_code, erc_sfx)
    gas_limit   = 21_000 + 68 * (len(data_suffix) // 2 - 1)  # 21000 + 68 per non-zero data byte (approx)

    print(f"Address:      {address}")
    print(f"Data suffix:  {data_suffix}")
    print(f"Chain ID:     {chain_id}")
    print(f"RPC:          {rpc_url}")
    print(f"Interval:     {interval}s")
    print("")

    # Check balance on startup
    try:
        balance_wei = eth_get_balance(rpc_url, address)
        balance_okb = balance_wei / 10**18
        print(f"Balance:      {balance_okb:.6f} OKB  ({balance_wei} wei)")
        if balance_wei == 0:
            print("WARNING: Balance is 0 — check that this address has funds on the selected network.")
    except Exception as e:
        print(f"WARNING: Could not fetch balance: {e}")
    print("")

    count = 0
    while True:
        count += 1
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        try:
            nonce     = eth_get_nonce(rpc_url, address)
            gas_price = eth_gas_price(rpc_url)
            balance_wei = eth_get_balance(rpc_url, address)
            tx_cost   = gas_limit * gas_price
            print(f"[{ts}] #{count} nonce={nonce}  gas_price={gas_price/1e9:.2f} gwei  gas_limit={gas_limit}  est_cost={tx_cost/1e18:.8f} OKB  balance={balance_wei/1e18:.8f} OKB")
            if balance_wei < tx_cost:
                raise RuntimeError(f"Insufficient balance: {balance_wei/1e18:.8f} OKB < est cost {tx_cost/1e18:.8f} OKB")
            raw_tx    = sign_tx(priv_int, address, data_suffix, nonce, gas_price, gas_limit, 0, chain_id)
            tx_hash   = eth_send_raw(rpc_url, raw_tx)
            print(f"[{ts}] #{count} ✓ {tx_hash}")
            print(f"  Explorer: {explorer}/{tx_hash}")
        except Exception as e:
            print(f"[{ts}] #{count} ✗ {e}")
        print(f"  Next send in {interval}s...")
        time.sleep(interval)

main()
'

# ── banner ─────────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════"
echo "  ERC-8021 Attribution Sender"
echo "════════════════════════════════════════════════════"
echo "  Network:      $NETWORK (chain $CHAIN_ID)"
echo "  RPC:          $RPC"
echo "  Builder Code: $BUILDER_CODE"
echo "  Interval:     ${INTERVAL}s"
echo "════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop."
echo ""

# ── run ────────────────────────────────────────────────────────────────────────
python3 -c "$PYTHON_HELPER" \
  "$PRIVATE_KEY" \
  "$BUILDER_CODE" \
  "$ERC_SUFFIX" \
  "$RPC" \
  "$CHAIN_ID" \
  "$EXPLORER" \
  "$INTERVAL"
