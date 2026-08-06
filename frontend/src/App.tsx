import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, Role, useAuth } from "./auth";

import Layout from "./components/Layout";
import Protected from "./components/Protected";
import DoctorSchedule from "./pages/DoctorSchedule";
import AdminUsers from "./pages/AdminUsers";
import AISummary from "./pages/AISummary";
import Appointments from "./pages/Appointments";
import Audit from "./pages/Audit";
import Operations from "./pages/Operations";
import Book from "./pages/Book";
import Consult from "./pages/Consult";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Documents from "./pages/Documents";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Records from "./pages/Records";
import Register from "./pages/Register";
import Reschedule from "./pages/Reschedule";

function LoadingPage() {
  return (
    <main className="page">
      <div className="card">
        <p>Loading MediFlow...</p>
      </div>
    </main>
  );
}

function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return <Navigate to={user ? `/${user.role}` : "/login"} replace />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

function Page({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <Protected role={role}>
      <Layout>{children}</Layout>
    </Protected>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          {/* Patient routes */}

          <Route
            path="/patient"
            element={
              <Page role="patient">
                <Dashboard />
              </Page>
            }
          />

          <Route
            path="/patient/doctors"
            element={
              <Page role="patient">
                <Doctors />
              </Page>
            }
          />

          <Route
            path="/patient/book/:doctorId"
            element={
              <Page role="patient">
                <Book />
              </Page>
            }
          />

          <Route
            path="/patient/appointments"
            element={
              <Page role="patient">
                <Appointments />
              </Page>
            }
          />

          <Route
            path="/patient/reschedule/:id"
            element={
              <Page role="patient">
                <Reschedule />
              </Page>
            }
          />

          <Route
            path="/patient/records"
            element={
              <Page role="patient">
                <Records />
              </Page>
            }
          />

          <Route
            path="/patient/documents"
            element={
              <Page role="patient">
                <Documents />
              </Page>
            }
          />

          <Route
            path="/patient/ai"
            element={
              <Page role="patient">
                <AISummary />
              </Page>
            }
          />

          <Route
            path="/patient/profile"
            element={
              <Page role="patient">
                <Profile />
              </Page>
            }
          />

          {/* Doctor routes */}

          <Route
            path="/doctor"
            element={
              <Page role="doctor">
                <Dashboard />
              </Page>
            }
          />

          <Route
            path="/doctor/appointments"
            element={
              <Page role="doctor">
                <Appointments />
              </Page>
            }
          />

          <Route
            path="/doctor/schedule"
            element={
              <Page role="doctor">
                <DoctorSchedule />
              </Page>
            }
          />

          <Route
            path="/doctor/consult/:id"
            element={
              <Page role="doctor">
                <Consult />
              </Page>
            }
          />

          {/* Admin routes */}

          <Route
            path="/admin"
            element={
              <Page role="admin">
                <Dashboard />
              </Page>
            }
          />

          <Route
            path="/admin/users"
            element={
              <Page role="admin">
                <AdminUsers />
              </Page>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <Page role="admin">
                <Appointments />
              </Page>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <Page role="admin">
                <Audit />
              </Page>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <Page role="admin">
                <Operations />
              </Page>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
