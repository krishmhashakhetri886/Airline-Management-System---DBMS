import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      phone.trim().length !== 10 ||
      !passport.trim()
    ) {
      setError('Please complete all required fields correctly');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          email_id: email.trim(),
          phone_no: phone.trim(),
          dob,
          passport_no: passport.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#06B6D4] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/80 text-sm">Register to book your next flight</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* FIRST NAME */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="First name"
              />
            </div>

            {/* MIDDLE NAME */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Middle name"
              />
            </div>

            {/* LAST NAME */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Last name"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="you@example.com"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                maxLength={10}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Phone number"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            {/* PASSPORT */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Passport Number
              </label>
              <input
                type="text"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Passport number"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#1E3A8A] font-semibold py-3 px-4 rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

          </form>

          <p className="mt-4 text-center text-white/80 text-sm">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="underline"
            >
              Sign In
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}