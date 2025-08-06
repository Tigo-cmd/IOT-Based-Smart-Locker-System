#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Keypad.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

// ── Configuration ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Tigonuel";
const char* WIFI_PASSWORD = "nueltigo";

const char* LOCKER_ID     = "LKR001";
const char* API_BASE_URL  = "http://10.127.39.48:5000/api/lockers";

const int SERVO_PIN       = 13;
const int BUZZER_PIN      = 12;

// ── Keypad Setup ───────────────────────────────────────────────────────────
const byte ROWS = 4, COLS = 4;
byte rowPins[ROWS] = { 19, 18, 5, 17 };
byte colPins[COLS] = { 16, 4, 2, 15 };
char keys[ROWS][COLS] = {
  { '1','2','3','A' },
  { '4','5','6','B' },
  { '7','8','9','C' },
  { '*','0','#','D' }
};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ── Display & Servo ────────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo latchServo;

// ── Helpers ─────────────────────────────────────────────────────────────────
void connectWiFi() {
  lcd.clear(); lcd.print("WiFi Connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry++ < 20) {
    delay(500); lcd.print(".");
  }
  lcd.clear();
  lcd.print(WiFi.status() == WL_CONNECTED ? "WiFi OK" : "WiFi Fail");
  delay(1000);
}

bool sendStatus(const char* status) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  String url = String(API_BASE_URL) + "/" + LOCKER_ID + "/status";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(String("{\"status\":\"") + status + "\"}");
  http.end();
  return (code == 204);
}

bool verifyOtp(const String& otp) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  String url = String(API_BASE_URL) + "/" + LOCKER_ID + "/verify-otp";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(String("{\"otp\":\"") + otp + "\"}");
  if (code != 200) { http.end(); return false; }
  StaticJsonDocument<200> doc;
  deserializeJson(doc, http.getString());
  http.end();
  return String(doc["status"]) == "success";
}

String fetchOtp() {
  if (WiFi.status() != WL_CONNECTED) return "";
  HTTPClient http;
  String url = String(API_BASE_URL) + "/" + LOCKER_ID + "/otp";
  http.begin(url);
  int code = http.GET();
  if (code != 200) { http.end(); return ""; }
  StaticJsonDocument<200> doc;
  deserializeJson(doc, http.getString());
  http.end();
  String otp = doc["otp"].as<String>();
  Serial.printf("Fetched OTP: %s (expires %s)\n", otp.c_str(), doc["expires_at"].as<const char*>());
  return otp;
}

void beep(bool ok) {
  int freq = ok ? 1000 : 300;
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, freq);
    delay(100);
    noTone(BUZZER_PIN);
    delay(100);
  }
}

void setLatch(bool unlocked) {
  latchServo.write(unlocked ? 0 : 90);
}

// ── Setup & Main Loop ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  lcd.init(); lcd.backlight();
  latchServo.attach(SERVO_PIN);
  pinMode(BUZZER_PIN, OUTPUT);

  connectWiFi();
  setLatch(false);
  sendStatus("closed");

  // Fetch & print OTP at startup
  String initialOtp = fetchOtp();
  if (initialOtp.length()) {
    lcd.clear();
    lcd.print("OTP:");
    lcd.setCursor(0,1);
    lcd.print(initialOtp);
    delay(3000);
  }
}

void loop() {
  lcd.clear(); lcd.print("Enter OTP (A=new)");
  lcd.setCursor(0,1);
  String otp = "";

  // Collect keys
  while (true) {
    char key = keypad.getKey();
    if (!key) continue;

    if (key >= '0' && key <= '9' && otp.length()<6) {
      otp += key; lcd.print('*');
    }
    else if (key == 'A') {
      // Request new OTP
      fetchOtp();
      lcd.clear(); lcd.print("Fetched new OTP");
      delay(2000);
      return;
    }
    else if (key == '#' && otp.length()==6) {
      break;
    }
    else if (key == '*') {
      otp = "";
      lcd.setCursor(0,1);
      lcd.print("      ");
      lcd.setCursor(0,1);
    }
  }

  // Verify & act
  lcd.clear(); lcd.print("Verifying...");
  bool ok = verifyOtp(otp);
  if (ok) {
    lcd.clear(); lcd.print("Access Granted");
    beep(true);
    setLatch(true);
    sendStatus("open");
    delay(10000);
    setLatch(false);
    sendStatus("closed");
    lcd.clear(); lcd.print("Locked");
    delay(2000);
  } else {
    lcd.clear(); lcd.print("Invalid OTP");
    beep(false);
    delay(2000);
  }
}

