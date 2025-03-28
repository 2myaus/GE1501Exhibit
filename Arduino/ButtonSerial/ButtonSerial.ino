const uint8_t PIN_BUTTON_IN = 3;
const uint8_t PIN_WHITE = A0;
const uint8_t PIN_BLUE = A1;
const uint8_t PIN_GREEN = A2;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(PIN_BUTTON_IN, INPUT_PULLUP);
  pinMode(PIN_WHITE, INPUT_PULLUP);
  pinMode(PIN_BLUE, INPUT_PULLUP);
  pinMode(PIN_GREEN, INPUT_PULLUP);
}

unsigned long lastPressed = 0;
void loop() {
  // put your main code here, to run repeatedly:
  if(digitalRead(PIN_BUTTON_IN)) return;
  if(millis() - lastPressed < 1000) return;

  lastPressed = millis();

  const unsigned short whiteIn = analogRead(PIN_WHITE);
  const unsigned short blueIn = analogRead(PIN_BLUE);
  const unsigned short greenIn = analogRead(PIN_GREEN);

  Serial.println("White: " + String(whiteIn)); //Rear sail spot
  Serial.println("Blue: " + String(blueIn)); //Hull spot
  Serial.println("Green: " + String(greenIn)); //Front sail spot
  Serial.print("end");
}
