Prompt: Analyze the codebase and look for the implmentation of requested feature and create use case diagram, use case description and activity diagram, just create another md file for the feature
--------------------------------------------------
USE CASE DIAGRAM PLANTUML CODE SAMPLE
--------------------------------------------------
@startuml Guest Login Use Case Diagram

left to right direction

actor "Guest User" as Guest

rectangle "SpeakForge Mobile App" {
    usecase "Login as Guest" as UC1
    usecase "Access Translation Features" as UC2
    usecase "View Language Options" as UC3
    usecase "Perform Text Translation" as UC4
}

Guest --> UC1
UC1 --> UC2 : <<include>>
UC1 --> UC3 : <<include>>
UC2 --> UC4 : <<include>>

note right of UC1
    Guest users can access
    basic translation features
    without account registration
end note

@enduml


------------------------------------------------
USE CASE DESCRIPTION SAMPLE
------------------------------------------------
Preconditions:
●	User has launched the SpeakForge app
●	User is on the welcome screen
Basic Flow (Main Success Scenario):
1.	User taps "CONTINUE AS GUEST" button
2.	System creates a temporary guest session
3.	System assigns default language settings
4.	System redirects user to the main application interface
5.	User accesses basic translation features
Alternative Flows (Extensions):
●	If network connection is unavailable, system displays error message and allows user to retry
Postconditions:
●	User is logged in with guest privileges
●	User can access basic translation features
●	Premium features remain locked
●	User session data is not persisted between app launches


-------------------------------------------------
ACTIVITY DIAGRAM PLANTUML CODE SAMPLE
--------------------------------------------------

@startuml Guest Login Activity Diagram
title Guest Login Activity Diagram

|User|
start
:App launches;
:Views Splash/Welcome Screen;

|SpeakForge System|
:Check if returning guest user;
if (Returning guest?) then (yes)
    :Load guest session;
else (no)
    :Show login options;
endif

|User|
:Chooses "Skip" (Guest Login);

|SpeakForge System|
:Set guest variables (UID, email, account type);
:Save guest status in SharedPreferences;
:Navigate to MainActivity (skip language setup);

|User|
:Access MainActivity with limited features;
if (Access restricted feature?) then (yes)
    :Show upgrade prompt;
    if (Choose to login?) then (yes)
        :Clear guest session;
        :Navigate to login flow;
    else (no)
        :Continue as guest;
    endif
else (no)
    :Use basic features;
endif

stop
@enduml

-------------------------------------------------