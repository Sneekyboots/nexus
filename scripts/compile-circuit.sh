#!/bin/bash

set -e

CIRCUIT="kyc_verification"
BUILD_DIR="/home/sriranjini/nexus/app/public/zk"
CIRCUIT_DIR="/home/sriranjini/nexus/circuits"
SNARKJS="npx snarkjs"

echo "[1/5] Creating powers of tau file..."
cd $CIRCUIT_DIR
$SNARKJS powersoftau new bn128 12 pot12_final.ptau -v

echo "[2/5] Compiling circuit..."
circom $CIRCUIT.circom --r1cs --wasm --sym -o $CIRCUIT_DIR

echo "[3/5] Contributing to ceremony..."
$SNARKJS ptc pot12_final.ptau pot12_contributed.ptau -n "NEXUS KYC" -v

echo "[4/5] Generating zKey..."
$SNARKJS powersoftau prepare phase2 pot12_contributed.ptau pot12_ready.ptau -v
$SNARKJS groth16 setup $CIRCUIT.r1cs pot12_ready.ptau ${CIRCUIT}_0000.zkey
$SNARKJS zkey contribute ${CIRCUIT}_0000.zkey ${CIRCUIT}_final.zkey -n "NEXUS KYC Final" -v

echo "[5/5] Exporting verification key..."
mkdir -p $BUILD_DIR
$SNARKJS zkey export verificationkey ${CIRCUIT}_final.zkey $BUILD_DIR/verification_key.json
cp ${CIRCUIT}_final.zkey $BUILD_DIR/
cp ${CIRCUIT}_js/${CIRCUIT}.wasm $BUILD_DIR/

echo ""
echo "ZK Circuit compiled successfully!"
echo "Files in $BUILD_DIR:"
ls -la $BUILD_DIR
