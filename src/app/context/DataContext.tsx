import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Airport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  id: string;
  code: string;
  name: string;
  logo: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airlineId: string;
  departureAirportId: string;
  arrivalAirportId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: 'scheduled' | 'delayed' | 'cancelled';
}

export interface Seat {
  id: string;
  flightId: string;
  seatNumber: string;
  row: number;
  column: string;
  class: 'economy' | 'business' | 'first';
  isBooked: boolean;
  bookingId?: string;
}

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  seatIds: string[];
  bookingDate: string;
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
  passengerName: string;
  passengerEmail: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

interface DataContextType {
  airports: Airport[];
  airlines: Airline[];
  flights: Flight[];
  seats: Seat[];
  bookings: Booking[];
  payments: Payment[];
  addAirport: (airport: Omit<Airport, 'id'>) => void;
  updateAirport: (id: string, airport: Partial<Airport>) => void;
  deleteAirport: (id: string) => void;
  addAirline: (airline: Omit<Airline, 'id'>) => void;
  updateAirline: (id: string, airline: Partial<Airline>) => void;
  deleteAirline: (id: string) => void;
  addFlight: (flight: Omit<Flight, 'id'>) => void;
  updateFlight: (id: string, flight: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'bookingDate'>, seatIds: string[]) => string;
  cancelBooking: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => void;
  getFlightSeats: (flightId: string) => Seat[];
  bookSeats: (flightId: string, seatIds: string[], bookingId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialAirports: Airport[] = [
  { id: 'apt1', code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { id: 'apt2', code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { id: 'apt3', code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { id: 'apt4', code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { id: 'apt5', code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA' },
];

const initialAirlines: Airline[] = [
  { id: 'arl1', code: 'AA', name: 'American Airlines', logo: '🛫' },
  { id: 'arl2', code: 'BA', name: 'British Airways', logo: '✈️' },
  { id: 'arl3', code: 'EK', name: 'Emirates', logo: '🛬' },
  { id: 'arl4', code: 'UA', name: 'United Airlines', logo: '🛩️' },
];

const initialFlights: Flight[] = [
  {
    id: 'flt1',
    flightNumber: 'AA101',
    airlineId: 'arl1',
    departureAirportId: 'apt1',
    arrivalAirportId: 'apt2',
    departureTime: '2026-04-20T10:00:00',
    arrivalTime: '2026-04-20T16:00:00',
    price: 350,
    availableSeats: 48,
    totalSeats: 60,
    status: 'scheduled'
  },
  {
    id: 'flt2',
    flightNumber: 'BA202',
    airlineId: 'arl2',
    departureAirportId: 'apt1',
    arrivalAirportId: 'apt3',
    departureTime: '2026-04-21T14:00:00',
    arrivalTime: '2026-04-22T02:00:00',
    price: 650,
    availableSeats: 40,
    totalSeats: 50,
    status: 'scheduled'
  },
  {
    id: 'flt3',
    flightNumber: 'EK303',
    airlineId: 'arl3',
    departureAirportId: 'apt3',
    arrivalAirportId: 'apt4',
    departureTime: '2026-04-22T08:00:00',
    arrivalTime: '2026-04-22T18:00:00',
    price: 850,
    availableSeats: 30,
    totalSeats: 40,
    status: 'scheduled'
  },
  {
    id: 'flt4',
    flightNumber: 'UA404',
    airlineId: 'arl4',
    departureAirportId: 'apt5',
    arrivalAirportId: 'apt1',
    departureTime: '2026-04-23T06:00:00',
    arrivalTime: '2026-04-23T14:00:00',
    price: 400,
    availableSeats: 0,
    totalSeats: 50,
    status: 'scheduled'
  },
];

function generateSeatsForFlight(flightId: string, totalSeats: number): Seat[] {
  const seats: Seat[] = [];
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = Math.ceil(totalSeats / columns.length);

  for (let row = 1; row <= rows; row++) {
    for (const column of columns) {
      if (seats.length >= totalSeats) break;

      let seatClass: 'economy' | 'business' | 'first' = 'economy';
      if (row <= 2) seatClass = 'first';
      else if (row <= 5) seatClass = 'business';

      seats.push({
        id: `${flightId}-${row}${column}`,
        flightId,
        seatNumber: `${row}${column}`,
        row,
        column,
        class: seatClass,
        isBooked: Math.random() > 0.7,
      });
    }
  }

  return seats;
}

const initialSeats: Seat[] = [
  ...generateSeatsForFlight('flt1', 60),
  ...generateSeatsForFlight('flt2', 50),
  ...generateSeatsForFlight('flt3', 40),
  ...generateSeatsForFlight('flt4', 50),
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [airports, setAirports] = useState<Airport[]>(initialAirports);
  const [airlines, setAirlines] = useState<Airline[]>(initialAirlines);
  const [flights, setFlights] = useState<Flight[]>(initialFlights);
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const addAirport = (airport: Omit<Airport, 'id'>) => {
    const newAirport = { ...airport, id: `apt${Date.now()}` };
    setAirports([...airports, newAirport]);
  };

  const updateAirport = (id: string, airport: Partial<Airport>) => {
    setAirports(airports.map(a => a.id === id ? { ...a, ...airport } : a));
  };

  const deleteAirport = (id: string) => {
    setAirports(airports.filter(a => a.id !== id));
  };

  const addAirline = (airline: Omit<Airline, 'id'>) => {
    const newAirline = { ...airline, id: `arl${Date.now()}` };
    setAirlines([...airlines, newAirline]);
  };

  const updateAirline = (id: string, airline: Partial<Airline>) => {
    setAirlines(airlines.map(a => a.id === id ? { ...a, ...airline } : a));
  };

  const deleteAirline = (id: string) => {
    setAirlines(airlines.filter(a => a.id !== id));
  };

  const addFlight = (flight: Omit<Flight, 'id'>) => {
    const newFlight = { ...flight, id: `flt${Date.now()}` };
    setFlights([...flights, newFlight]);
    const newSeats = generateSeatsForFlight(newFlight.id, newFlight.totalSeats);
    setSeats([...seats, ...newSeats]);
  };

  const updateFlight = (id: string, flight: Partial<Flight>) => {
    setFlights(flights.map(f => f.id === id ? { ...f, ...flight } : f));
  };

  const deleteFlight = (id: string) => {
    setFlights(flights.filter(f => f.id !== id));
    setSeats(seats.filter(s => s.flightId !== id));
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'bookingDate'>, seatIds: string[]) => {
    const newBooking: Booking = {
      ...booking,
      id: `bkg${Date.now()}`,
      bookingDate: new Date().toISOString(),
    };
    setBookings([...bookings, newBooking]);
    return newBooking.id;
  };

  const cancelBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
      setSeats(seats.map(s =>
        booking.seatIds.includes(s.id)
          ? { ...s, isBooked: false, bookingId: undefined }
          : s
      ));
      const flight = flights.find(f => f.id === booking.flightId);
      if (flight) {
        setFlights(flights.map(f =>
          f.id === booking.flightId
            ? { ...f, availableSeats: f.availableSeats + booking.seatIds.length }
            : f
        ));
      }
    }
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'paymentDate'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `pmt${Date.now()}`,
      paymentDate: new Date().toISOString(),
    };
    setPayments([...payments, newPayment]);
  };

  const getFlightSeats = (flightId: string) => {
    return seats.filter(s => s.flightId === flightId);
  };

  const bookSeats = (flightId: string, seatIds: string[], bookingId: string) => {
    setSeats(seats.map(s =>
      seatIds.includes(s.id)
        ? { ...s, isBooked: true, bookingId }
        : s
    ));
    const flight = flights.find(f => f.id === flightId);
    if (flight) {
      setFlights(flights.map(f =>
        f.id === flightId
          ? { ...f, availableSeats: f.availableSeats - seatIds.length }
          : f
      ));
    }
  };

  return (
    <DataContext.Provider value={{
      airports,
      airlines,
      flights,
      seats,
      bookings,
      payments,
      addAirport,
      updateAirport,
      deleteAirport,
      addAirline,
      updateAirline,
      deleteAirline,
      addFlight,
      updateFlight,
      deleteFlight,
      addBooking,
      cancelBooking,
      addPayment,
      getFlightSeats,
      bookSeats,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
