import { useTripStore } from './hooks/useTripStore';
import SetupScreen from './components/SetupScreen';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

export default function App() {
  const store = useTripStore();
  const { state, loading, error, tripId } = store;

  if (loading) return <LoadingScreen />;

  if (!state.trip || !tripId) {
    return (
      <SetupScreen
        onSetup={(tripData, travelerNames) => store.createTrip(tripData, travelerNames)}
        onJoin={(id) => store.joinTrip(id)}
        error={error}
      />
    );
  }

  return <Dashboard state={state} store={store} tripId={tripId} />;
}
