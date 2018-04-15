$(document).ready(function () {
	var result = $('.result');

	$('#submit-decription').click(function (event) {
		event.preventDefault();
		result.empty();
		decr(result);
	});
	$('#submit-encription').click(function (event) {
		event.preventDefault();
		result.empty();
		encr(result);
	});
});

function encr(result) {

	var stringToEncrypt = $('#encr').val();
	var rounds = $('#encr-rounds').val();
	if(isNaN(rounds)){
	alert("Rounds input must be a number");
    return;
	}

	var answer = "Your Encrypted text: ";

//Step1: convert the plaintext to an array of bytes
	var bytesToEncrypt = stringUTF8ToBytes(stringToEncrypt);

	var key = $('#encr-key').val();

// Step2: length must be even!
	if (bytesToEncrypt.length % 2 == 1) {
			bytesToEncrypt.push(0);
		}

// Step3: pass the bytes and the key to the fiestel method, it will return encrypted array of bytes
	var bytesEncrypted = feistelAlgorithm(bytesToEncrypt, key, false, rounds); // encryptRatherThanDecrypt;

answer = answer +  window.btoa(ByteManager.bytesToStringHexadecimal(bytesEncrypted).replace(/\s/g, '')) + "<br />";
answer=wordWrap(answer, 30);
	$('.result').html(answer);

}


function decr(result) {

	var stringToDecrypt = $('#decr').val();
	var rounds = $('#decr-rounds').val();

	if(isNaN(rounds)){
	alert("Rounds input must be a number");
    return;
	}


	var answer = "Your Decrypted text: ";

	var stringToDecrypt = window.atob(stringToDecrypt);

	var key = $('#decr-key').val();

	var bytesEncrypted = toByteArray(stringToDecrypt);

	var bytesDecrypted = feistelAlgorithm(bytesEncrypted, key, true, rounds);
	var stringDecrypted = ByteManager.bytesToStringUTF8(bytesDecrypted);

	answer = answer +  stringDecrypted + "<br />";
	answer=wordWrap(answer, 30);

	$('.result').html(answer);

}


function wordWrap(str, maxWidth) {
    var newLineStr = "\n"; done = false; res = '';
    do {                    
        found = false;
        // Inserts new line at first whitespace of the line
        for (i = maxWidth - 1; i >= 0; i--) {
            if (testWhite(str.charAt(i))) {
                res = res + [str.slice(0, i), newLineStr].join('');
                str = str.slice(i + 1);
                found = true;
                break;
            }
        }
        // Inserts new line at maxWidth position, the word is too long to wrap
        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }

        if (str.length < maxWidth)
            done = true;
    } while (!done);

    return res + str;
}

function testWhite(x) {
    var white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
};

function toByteArray(hexString) {
	var result = [];
	while (hexString.length >= 2) {
		result.push(parseInt(hexString.substring(0, 2), 16));
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

Array.prototype.overwriteWith = function (other) {
	this.length = 0;

	for (var i = 0; i < other.length; i++) {
		this[i] = other[i];
	}
}

function ByteManager() {} {
	ByteManager.BitsPerByte = 8;
	ByteManager.BitsPerNibble = ByteManager.BitsPerByte / 2;
	ByteManager.ByteValueMax = Math.pow(2, ByteManager.BitsPerByte) - 1;

	ByteManager.bytesToStringUTF8 = function (bytesToConvert) {
		var returnValue = "";

		for (var i = 0; i < bytesToConvert.length; i++) {
			var charCode = bytesToConvert[i];
			var character = String.fromCharCode(charCode);
			returnValue += character;
		}

		return returnValue;
	}

	ByteManager.bytesToStringHexadecimal = function (bytesToConvert) {
		var returnValue = "";

		var bitsPerNibble = ByteManager.BitsPerNibble;

		for (var i = 0; i < bytesToConvert.length; i++) {
			var byte = bytesToConvert[i];

			for (var d = 1; d >= 0; d--) {
				var digitValue = byte >> (bitsPerNibble * d) & 0xF;
				var digitString = "";
				digitString += (digitValue < 10 ? digitValue : String.fromCharCode(55 + digitValue));
				returnValue += digitString;
			}

			returnValue += " ";
		}

		return returnValue;
	}

	ByteManager.xorBytesWithOthers = function (bytes0, bytes1) {
		for (var i = 0; i < bytes0.length; i++) {
			bytes0[i] ^= bytes1[i];
		}
		return bytes0;
	}
}

//Simple algorithm to derive multiple subkeys based on number of rounds
function deriveRoundSubkeysFromKey(keyAs32BitInteger, rounds) {
		var returnValues = [];
		for (var r = 0; r < rounds; r++) {
			var subkeyForRound =
				(
					keyAs32BitInteger >>
					(r * ByteManager.BitsPerByte)
				) &
				0xFF;

			returnValues.push(subkeyForRound);
		}

		return returnValues;
	}

 function encryptionFunctionForRound(right, key)  {
		// Simple encryption function for rounds
		for (var i = 0; i < right.length; i++) {
			right[i] = (right[i] + key) % ByteManager.ByteValueMax;
		}
	}

function feistelAlgorithm(bytesToEncryptOrDecrypt, key, decryptRatherThanEncrypt, rounds) {

	//Step4: Deriving subkeys for each round, the method return array of keys
		var subkeysForRounds = deriveRoundSubkeysFromKey(key, rounds);

		var numberOfRounds = subkeysForRounds.length;

		var numberOfBytes = bytesToEncryptOrDecrypt.length;
		var numberOfBytesHalf = numberOfBytes / 2;

		var left = bytesToEncryptOrDecrypt.slice(0, numberOfBytesHalf);
		var right = bytesToEncryptOrDecrypt.slice(numberOfBytesHalf);

		var leftNext = left.slice(0);
		var rightNext = right.slice(0);

		for (var r = 0; r < numberOfRounds; r++) {
			var subkeyIndex =(decryptRatherThanEncrypt ? numberOfRounds -r-1 : r);

			var subkeyForRound = subkeysForRounds[subkeyIndex];

			leftNext.overwriteWith(right);
			rightNext.overwriteWith(left);

			this.encryptionFunctionForRound(right, subkeyForRound);
			ByteManager.xorBytesWithOthers(rightNext, right)

			left.overwriteWith(leftNext);
			right.overwriteWith(rightNext);
		}

		var returnValue = [].concat(right).concat(left);

		return returnValue;
	}

 function stringUTF8ToBytes(stringToConvert) {
		var returnValues = [];

		for (var i = 0; i < stringToConvert.length; i++) {
			var charCode = stringToConvert.charCodeAt(i);
			returnValues.push(charCode);
		}

		return returnValues;
	}