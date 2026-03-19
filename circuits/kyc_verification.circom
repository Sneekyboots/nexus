pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template KycVerifier() {
    signal input documentHash;
    signal input secret;
    signal input expectedHash;
    signal output valid;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== documentHash;
    poseidon.inputs[1] <== secret;
    
    poseidon.out === expectedHash;
    valid <== 1;
}

component main = KycVerifier();
