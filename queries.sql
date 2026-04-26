-- =========================================
-- AIRLINE MANAGEMENT SYSTEM DATABASE SETUP
-- =========================================

DROP DATABASE IF EXISTS airlinedb;
CREATE DATABASE airlinedb;
USE airlinedb;

-- =========================================
-- AIRLINE
-- =========================================
CREATE TABLE airline (
airline_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
code VARCHAR(20),
rating DECIMAL(2,1)
);

INSERT INTO airline (name, code, rating) VALUES
('IndiGo', '6E', 4.5),
('Air India', 'AI', 4.0),
('SpiceJet', 'SG', 3.8),
('Vistara', 'UK', 4.3),
('Akasa Air', 'QP', 4.1);

-- =========================================
-- AIRPORT
-- =========================================
CREATE TABLE airport (
airport_code VARCHAR(10) PRIMARY KEY,
name VARCHAR(100),
city VARCHAR(100),
terminal VARCHAR(50),
status VARCHAR(20) DEFAULT 'ACTIVE'
);

INSERT INTO airport VALUES
('DEL','Indira Gandhi Airport','Delhi','T1,T2,T3','ACTIVE'),
('BOM','Mumbai Airport','Mumbai','T2','ACTIVE'),
('BLR','Bangalore Airport','Bangalore','T1,T2','ACTIVE'),
('HYD','Hyderabad Airport','Hyderabad','T1','ACTIVE'),
('MAA','Chennai Airport','Chennai','T1,T2','ACTIVE'),
('KOL','Kolkata Airport','Kolkata','T1,T2','ACTIVE'),
('PNQ','Pune Airport','Pune','T1','ACTIVE'),
('AMD','Ahmedabad Airport','Ahmedabad','T1','ACTIVE');

-- =========================================
-- AIRCRAFT
-- =========================================
CREATE TABLE aircraft (
aircraft_id INT AUTO_INCREMENT PRIMARY KEY,
model VARCHAR(100),
airline_id INT,
total_seats INT,
economy_seats INT,
business_seats INT,
FOREIGN KEY (airline_id) REFERENCES airline(airline_id)
);

INSERT INTO aircraft (model, airline_id, total_seats, economy_seats, business_seats) VALUES
('Airbus A320',1,180,150,30),
('Boeing 737',2,160,130,30),
('Airbus A321',3,200,170,30),
('Boeing 787',4,250,200,50),
('Airbus A220',5,120,100,20);

-- =========================================
-- FLIGHT
-- =========================================
CREATE TABLE flight (
flight_id INT AUTO_INCREMENT PRIMARY KEY,
source VARCHAR(10),
destination VARCHAR(10),
departure_time DATETIME,
arrival_time DATETIME,
aircraft_id INT,
source_terminal VARCHAR(10),
destination_terminal VARCHAR(10),
flight_date DATE,
available_seats INT,
status VARCHAR(20) DEFAULT 'ACTIVE',
economy_price DECIMAL(10,2),
business_price DECIMAL(10,2),
FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id),
FOREIGN KEY (source) REFERENCES airport(airport_code),
FOREIGN KEY (destination) REFERENCES airport(airport_code)
);

INSERT INTO flight VALUES
(1,'DEL','BOM','2026-05-01 10:00:00','2026-05-01 12:00:00',1,'T1','T2','2026-05-01',180,'ACTIVE',5000,9000),
(2,'BOM','BLR','2026-05-02 14:00:00','2026-05-02 16:30:00',2,'T2','T1','2026-05-02',160,'ACTIVE',4500,8000),
(3,'BLR','DEL','2026-05-03 09:00:00','2026-05-03 11:30:00',3,'T1','T1','2026-05-03',200,'ACTIVE',4800,8500),
(4,'HYD','MAA','2026-05-04 11:00:00','2026-05-04 13:00:00',4,'T1','T2','2026-05-04',250,'ACTIVE',5200,10000),
(5,'MAA','KOL','2026-05-05 08:00:00','2026-05-05 11:00:00',5,'T1','T1','2026-05-05',120,'INACTIVE',4000,7000);

-- =========================================
-- PASSENGER
-- =========================================
CREATE TABLE passenger (
passenger_id INT PRIMARY KEY,
first_name VARCHAR(50),
middle_name VARCHAR(50),
last_name VARCHAR(50),
email_id VARCHAR(100),
phone_no VARCHAR(15),
dob DATE,
passport_no VARCHAR(50),
password VARCHAR(255)
);

INSERT INTO passenger VALUES
(301,'Krish','M','Mhashakhetri','krish@test.com','9876543210','2004-05-10','P10001','123'),
(302,'Aman','','Sharma','aman@test.com','9876543211','2003-03-12','P10002','123'),
(303,'Riya','','Patel','riya@test.com','9876543212','2002-07-21','P10003','123');

-- =========================================
-- BOOKING
-- =========================================
CREATE TABLE booking (
booking_id INT AUTO_INCREMENT PRIMARY KEY,
class VARCHAR(20),
amount DECIMAL(10,2),
status VARCHAR(20),
passenger_id INT,
flight_id INT,
FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE SET NULL
);

INSERT INTO booking VALUES
(1,'Economy',5000,'CANCELLED',301,1),
(6,'Business',28000,'CONFIRMED',301,5),
(7,'Business',45000,'CONFIRMED',301,1);

-- =========================================
-- BOOKING SEAT
-- =========================================
CREATE TABLE booking_seat (
booking_id INT,
seat_no VARCHAR(10),
flight_id INT,
PRIMARY KEY (booking_id, seat_no),
FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,
FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE
);

INSERT INTO booking_seat VALUES
(1,'E1',1),
(6,'B1',5),
(7,'B2',1);

-- =========================================
-- PAYMENT
-- =========================================
CREATE TABLE payment (
payment_id INT AUTO_INCREMENT PRIMARY KEY,
method VARCHAR(50),
status VARCHAR(20),
booking_id INT UNIQUE,
FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);

INSERT INTO payment VALUES
(1,'card','Success',1),
(6,'credit_card','Success',6),
(7,'credit_card','Success',7);

-- =========================================
-- USER (ADMIN)
-- =========================================
CREATE TABLE user (
user_id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(100),
password VARCHAR(100),
role ENUM('admin','passenger')
);

INSERT INTO user VALUES
(1,'admin@airline.com','admin123','admin');

-- =========================================
-- DONE
-- =========================================
-- Run this file using:
-- SOURCE queries.sql;