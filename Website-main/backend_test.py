#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CS16ServerAPITester:
    def __init__(self, base_url="https://fragzone-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            return success, response.status_code, response.json() if response.content else {}

        except requests.exceptions.RequestException as e:
            return False, 0, {"error": str(e)}
        except json.JSONDecodeError:
            return False, response.status_code, {"error": "Invalid JSON response"}

    def test_auth_login_admin(self):
        """Test admin login"""
        success, status, response = self.make_request(
            'POST', 'auth/login', 
            {"email": "admin@cs16server.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_auth_login_user(self):
        """Test user login"""
        success, status, response = self.make_request(
            'POST', 'auth/login',
            {"email": "demo@player.com", "password": "demo123"}
        )
        if success and 'token' in response:
            self.user_token = response['token']
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_auth_me(self):
        """Test get current user"""
        if not self.admin_token:
            self.log_test("Get Current User", False, "No admin token available")
            return False
            
        success, status, response = self.make_request(
            'GET', 'auth/me', token=self.admin_token
        )
        if success and 'email' in response:
            self.log_test("Get Current User", True)
            return True
        else:
            self.log_test("Get Current User", False, f"Status: {status}, Response: {response}")
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, status, response = self.make_request('GET', 'dashboard/stats')
        if success and all(key in response for key in ['total_users', 'total_players', 'total_bans', 'online_players']):
            self.log_test("Dashboard Stats", True)
            return True
        else:
            self.log_test("Dashboard Stats", False, f"Status: {status}, Response: {response}")
            return False

    def test_server_status(self):
        """Test server status endpoint"""
        success, status, response = self.make_request('GET', 'server-status')
        if success and all(key in response for key in ['online', 'server_ip', 'current_map', 'players_online']):
            self.log_test("Server Status", True)
            return True
        else:
            self.log_test("Server Status", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_bans(self):
        """Test get bans endpoint"""
        success, status, response = self.make_request('GET', 'bans')
        if success and isinstance(response, list):
            self.log_test("Get Bans", True)
            return True
        else:
            self.log_test("Get Bans", False, f"Status: {status}, Response: {response}")
            return False

    def test_search_bans(self):
        """Test search bans functionality"""
        success, status, response = self.make_request('GET', 'bans?search=Cheater')
        if success and isinstance(response, list):
            self.log_test("Search Bans", True)
            return True
        else:
            self.log_test("Search Bans", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_players(self):
        """Test get players endpoint"""
        success, status, response = self.make_request('GET', 'players')
        if success and isinstance(response, list):
            self.log_test("Get Players", True)
            return True
        else:
            self.log_test("Get Players", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_top_players(self):
        """Test get top players endpoint"""
        success, status, response = self.make_request('GET', 'rankings/top?limit=5')
        if success and isinstance(response, list) and len(response) <= 5:
            self.log_test("Get Top Players", True)
            return True
        else:
            self.log_test("Get Top Players", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_player_profile(self):
        """Test get individual player profile"""
        # First get a player to test with
        success, status, players = self.make_request('GET', 'players')
        if success and players and len(players) > 0:
            steamid = players[0]['steamid']
            success, status, response = self.make_request('GET', f'players/{steamid}')
            if success and 'steamid' in response:
                self.log_test("Get Player Profile", True)
                return True
            else:
                self.log_test("Get Player Profile", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Get Player Profile", False, "No players available to test")
            return False

    def test_submit_admin_application(self):
        """Test submit admin application"""
        app_data = {
            "nickname": f"TestApplicant_{datetime.now().strftime('%H%M%S')}",
            "steamid": "STEAM_0:0:999999",
            "age": 25,
            "experience": "5 years CS experience",
            "reason": "Want to help the community"
        }
        success, status, response = self.make_request('POST', 'admin-applications', app_data, expected_status=200)
        if success and 'id' in response:
            self.log_test("Submit Admin Application", True)
            return response['id']
        else:
            self.log_test("Submit Admin Application", False, f"Status: {status}, Response: {response}")
            return None

    def test_admin_get_applications(self):
        """Test admin get applications (admin only)"""
        if not self.admin_token:
            self.log_test("Admin Get Applications", False, "No admin token available")
            return False
            
        success, status, response = self.make_request('GET', 'admin-applications', token=self.admin_token)
        if success and isinstance(response, list):
            self.log_test("Admin Get Applications", True)
            return True
        else:
            self.log_test("Admin Get Applications", False, f"Status: {status}, Response: {response}")
            return False

    def test_admin_get_users(self):
        """Test admin get users (admin only)"""
        if not self.admin_token:
            self.log_test("Admin Get Users", False, "No admin token available")
            return False
            
        success, status, response = self.make_request('GET', 'admin/users', token=self.admin_token)
        if success and isinstance(response, list):
            self.log_test("Admin Get Users", True)
            return True
        else:
            self.log_test("Admin Get Users", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_access_admin_endpoint(self):
        """Test that regular user cannot access admin endpoints"""
        if not self.user_token:
            self.log_test("User Access Admin Endpoint (Should Fail)", False, "No user token available")
            return False
            
        success, status, response = self.make_request('GET', 'admin/users', token=self.user_token, expected_status=403)
        if success:  # Should get 403 Forbidden
            self.log_test("User Access Admin Endpoint (Should Fail)", True)
            return True
        else:
            self.log_test("User Access Admin Endpoint (Should Fail)", False, f"Expected 403, got {status}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting CS 1.6 Server API Tests")
        print("=" * 50)

        # Authentication tests
        print("\n📝 Authentication Tests:")
        self.test_auth_login_admin()
        self.test_auth_login_user()
        self.test_auth_me()

        # Public endpoint tests
        print("\n🌐 Public Endpoint Tests:")
        self.test_dashboard_stats()
        self.test_server_status()
        self.test_get_bans()
        self.test_search_bans()
        self.test_get_players()
        self.test_get_top_players()
        self.test_get_player_profile()

        # Application tests
        print("\n📋 Application Tests:")
        app_id = self.test_submit_admin_application()

        # Admin endpoint tests
        print("\n🔐 Admin Endpoint Tests:")
        self.test_admin_get_applications()
        self.test_admin_get_users()

        # Security tests
        print("\n🛡️ Security Tests:")
        self.test_user_access_admin_endpoint()

        # Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CS16ServerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())