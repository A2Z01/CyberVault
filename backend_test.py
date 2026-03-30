import requests
import sys
import json
import math
from datetime import datetime

class CyberVaultAPITester:
    def __init__(self, base_url="https://secure-phrase.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_response=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    response_data = response.json()
                except:
                    pass

            if success:
                # Additional validation if provided
                if validate_response and response_data:
                    validation_result = validate_response(response_data)
                    if not validation_result[0]:
                        success = False
                        print(f"❌ Failed - Validation error: {validation_result[1]}")
                    else:
                        print(f"✅ Passed - Status: {response.status_code}, Validation: OK")
                else:
                    print(f"✅ Passed - Status: {response.status_code}")
                
                if success:
                    self.tests_passed += 1
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                if response_data:
                    error_msg += f", Response: {response_data}"
                print(f"❌ Failed - {error_msg}")
                self.failed_tests.append(f"{name}: {error_msg}")

            return success, response_data

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"❌ Failed - {error_msg}")
            self.failed_tests.append(f"{name}: {error_msg}")
            return False, {}

    def validate_passphrase_response(self, data):
        """Validate passphrase generation response"""
        required_fields = ['passphrase', 'entropy', 'strength']
        
        for field in required_fields:
            if field not in data:
                return False, f"Missing field: {field}"
        
        # Validate passphrase is not empty
        if not data['passphrase'] or not isinstance(data['passphrase'], str):
            return False, "Passphrase is empty or not a string"
        
        # Validate entropy is a number
        if not isinstance(data['entropy'], (int, float)) or data['entropy'] <= 0:
            return False, f"Invalid entropy value: {data['entropy']}"
        
        # Validate strength classification
        valid_strengths = ['weak', 'medium', 'secure']
        if data['strength'] not in valid_strengths:
            return False, f"Invalid strength value: {data['strength']}"
        
        # Validate strength matches entropy
        entropy = data['entropy']
        expected_strength = 'weak' if entropy < 45 else 'medium' if entropy < 65 else 'secure'
        if data['strength'] != expected_strength:
            return False, f"Strength mismatch: got {data['strength']}, expected {expected_strength} for entropy {entropy}"
        
        return True, "Valid response"

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_basic_passphrase_generation(self):
        """Test basic passphrase generation with default parameters"""
        return self.run_test(
            "Basic Passphrase Generation",
            "POST",
            "generate",
            200,
            data={},
            validate_response=self.validate_passphrase_response
        )

    def test_word_count_variations(self):
        """Test different word count values"""
        results = []
        for word_count in [3, 4, 5, 6, 7, 8]:
            success, data = self.run_test(
                f"Word Count {word_count}",
                "POST",
                "generate",
                200,
                data={"word_count": word_count},
                validate_response=self.validate_passphrase_response
            )
            
            if success and data:
                # Count words in passphrase
                passphrase = data['passphrase']
                # Handle different separators
                word_parts = passphrase.replace('-', ' ').replace('_', ' ').replace('.', ' ').split()
                # Remove any trailing digits
                if word_parts and word_parts[-1].isdigit():
                    word_parts = word_parts[:-1]
                
                actual_word_count = len([part for part in word_parts if part.isalpha()])
                if actual_word_count != word_count:
                    print(f"⚠️  Word count mismatch: expected {word_count}, got {actual_word_count} in '{passphrase}'")
            
            results.append(success)
        
        return all(results)

    def test_separator_variations(self):
        """Test different separator options"""
        separators = ["-", "_", " ", ".", ""]
        results = []
        
        for separator in separators:
            success, data = self.run_test(
                f"Separator '{separator if separator else 'none'}'",
                "POST",
                "generate",
                200,
                data={"separator": separator, "word_count": 4},
                validate_response=self.validate_passphrase_response
            )
            
            if success and data:
                passphrase = data['passphrase']
                if separator and separator in passphrase:
                    print(f"✓ Separator '{separator}' found in passphrase")
                elif not separator:
                    print(f"✓ No separator used as expected")
            
            results.append(success)
        
        return all(results)

    def test_append_digit_functionality(self):
        """Test append digit functionality"""
        # Test with append_digit = True
        success_with_digit, data_with_digit = self.run_test(
            "Append Digit True",
            "POST",
            "generate",
            200,
            data={"append_digit": True, "word_count": 4},
            validate_response=self.validate_passphrase_response
        )
        
        # Test with append_digit = False
        success_without_digit, data_without_digit = self.run_test(
            "Append Digit False",
            "POST",
            "generate",
            200,
            data={"append_digit": False, "word_count": 4},
            validate_response=self.validate_passphrase_response
        )
        
        # Verify digit appending
        if success_with_digit and data_with_digit:
            passphrase = data_with_digit['passphrase']
            if passphrase and passphrase[-1].isdigit():
                print("✓ Digit correctly appended")
            else:
                print("⚠️  Expected digit at end of passphrase")
        
        return success_with_digit and success_without_digit

    def test_entropy_calculations(self):
        """Test entropy calculation accuracy"""
        test_cases = [
            {"word_count": 3, "append_digit": False, "expected_min_entropy": 35},
            {"word_count": 4, "append_digit": False, "expected_min_entropy": 47},
            {"word_count": 5, "append_digit": False, "expected_min_entropy": 58},
            {"word_count": 6, "append_digit": False, "expected_min_entropy": 70},
            {"word_count": 4, "append_digit": True, "expected_min_entropy": 50},
        ]
        
        results = []
        for case in test_cases:
            success, data = self.run_test(
                f"Entropy Test (words={case['word_count']}, digit={case['append_digit']})",
                "POST",
                "generate",
                200,
                data={"word_count": case["word_count"], "append_digit": case["append_digit"]},
                validate_response=self.validate_passphrase_response
            )
            
            if success and data:
                entropy = data['entropy']
                if entropy >= case['expected_min_entropy']:
                    print(f"✓ Entropy {entropy} meets minimum {case['expected_min_entropy']}")
                else:
                    print(f"⚠️  Entropy {entropy} below expected minimum {case['expected_min_entropy']}")
            
            results.append(success)
        
        return all(results)

    def test_strength_classification(self):
        """Test strength classification boundaries"""
        # Test weak strength (3 words should be < 45 bits)
        success_weak, data_weak = self.run_test(
            "Weak Strength Classification",
            "POST",
            "generate",
            200,
            data={"word_count": 3, "append_digit": False},
            validate_response=self.validate_passphrase_response
        )
        
        # Test secure strength (7+ words should be > 65 bits)
        success_secure, data_secure = self.run_test(
            "Secure Strength Classification",
            "POST",
            "generate",
            200,
            data={"word_count": 7, "append_digit": False},
            validate_response=self.validate_passphrase_response
        )
        
        if success_weak and data_weak:
            if data_weak['strength'] == 'weak':
                print("✓ Weak strength correctly classified")
            else:
                print(f"⚠️  Expected 'weak', got '{data_weak['strength']}' for entropy {data_weak['entropy']}")
        
        if success_secure and data_secure:
            if data_secure['strength'] == 'secure':
                print("✓ Secure strength correctly classified")
            else:
                print(f"⚠️  Expected 'secure', got '{data_secure['strength']}' for entropy {data_secure['entropy']}")
        
        return success_weak and success_secure

    def test_invalid_parameters(self):
        """Test API error handling with invalid parameters"""
        # Test invalid word count (too low)
        success_low, _ = self.run_test(
            "Invalid Word Count (too low)",
            "POST",
            "generate",
            400,
            data={"word_count": 2}
        )
        
        # Test invalid word count (too high)
        success_high, _ = self.run_test(
            "Invalid Word Count (too high)",
            "POST",
            "generate",
            400,
            data={"word_count": 10}
        )
        
        return success_low and success_high

    def test_cryptographic_randomness(self):
        """Test that multiple generations produce different results"""
        passphrases = []
        for i in range(5):
            success, data = self.run_test(
                f"Randomness Test {i+1}",
                "POST",
                "generate",
                200,
                data={"word_count": 4},
                validate_response=self.validate_passphrase_response
            )
            
            if success and data:
                passphrases.append(data['passphrase'])
        
        # Check that all passphrases are unique
        unique_passphrases = set(passphrases)
        if len(unique_passphrases) == len(passphrases):
            print("✓ All generated passphrases are unique")
            return True
        else:
            print(f"⚠️  Only {len(unique_passphrases)} unique passphrases out of {len(passphrases)}")
            return False

def main():
    print("🔐 Cyber-Vault Passphrase Generator API Testing")
    print("=" * 50)
    
    tester = CyberVaultAPITester()
    
    # Run all tests
    test_methods = [
        tester.test_root_endpoint,
        tester.test_basic_passphrase_generation,
        tester.test_word_count_variations,
        tester.test_separator_variations,
        tester.test_append_digit_functionality,
        tester.test_entropy_calculations,
        tester.test_strength_classification,
        tester.test_invalid_parameters,
        tester.test_cryptographic_randomness,
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test {test_method.__name__} failed with exception: {str(e)}")
            tester.failed_tests.append(f"{test_method.__name__}: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())