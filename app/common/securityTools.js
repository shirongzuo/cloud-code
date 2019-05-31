'use strict';

var ffi = require('ffi'),
	ref = require('ref');

// // Import library functions
// var security_library = new ffi.Library('.\\dll\\ndcode_security_toolset.dll', {
//     generateRandomChallenge : [ref.types.int, [
// 		ref.refType(ref.types.char),
// 		ref.types.uint
// 	]],
// 	verifySignature : [ref.types.int, [
// 		ref.refType(ref.types.char),
// 		ref.refType(ref.types.char),
// 		ref.refType(ref.types.char)
// 	]]
// });

// // The object service.
// var security = {};

// // Function to generate random number 
// security.generateRandomChallenge = function() {
// 	var rn_buf = Buffer.alloc(65);
// 	rn_buf.type = ref.types.char;
	
// 	var status_ = security_library.generateRandomChallenge(rn_buf, rn_buf.length);
// 	if(status_ == 0){
// 		var random_challenge = ref.readCString(rn_buf,0);
// 		//console.log(ref.readCString(rn_buf,0));
// 		return random_challenge;
// 	} else {
// 		return -1;
// 	}
// }

// // Function to verify Recoverable Signature
// security.verifySignature = function(info, signature_hex, uid) {
// 	var info_buf = Buffer.from(info+'\0');
// 	info_buf.type = ref.types.char;
// 	var signature_hex_buf = Buffer.from(signature_hex+'\0');
// 	signature_hex_buf.type = ref.types.char;
// 	var uid_buf = Buffer.from(uid+'\0');
// 	uid_buf.type = ref.types.char;
// 	return security_library.verifySignature(signature_hex_buf, info_buf, uid_buf);
// }

module.exports = security;