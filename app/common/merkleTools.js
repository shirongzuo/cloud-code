'use strict';

var MerkleTools = require('merkle-tools');

function getMerkleProof(object_info_str, proof_id){
	// replace "'" with "\""
	var object_info_str_fixed = object_info_str.replace(/'/g, "\"");
	//console.log(object_info_str_fixed);
	// parse object_info string into JSON object
	var object_info = JSON.parse(object_info_str_fixed);
	//console.log(object_info);
	
	// Sort object info
	const object_info_ordered = {};
	Object.keys(object_info).sort().forEach(function(key) {
		object_info_ordered[key] = object_info[key];
	});
	//console.log(object_info_ordered);
	
	// add some leaves to a merkle tree
	var merkleTools = new MerkleTools();
	var i;
	for(i in object_info_ordered){
		//console.log(object_info_ordered[i]);
		merkleTools.addLeaf(object_info_ordered[i], true);
	}

	// make the merkle tree
	merkleTools.makeTree();
	while(!merkleTools.getTreeReadyState());

	var merkle_proof = merkleTools.getMerkleRoot().toString('hex');
	//console.log("merkle root value: " + merkle_proof);
	
	// get proof array for leaf data at index :id
	var index = parseInt(proof_id); // convert string to int
	var proof = merkleTools.getProof(index);
	//console.log("Proof at Index: " + proof);
	
	return { 
		proof: proof, 
		merkle_proof: merkle_proof
	}
}

module.exports = {
  getMerkleProof: getMerkleProof,
}
