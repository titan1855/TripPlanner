import { useRouter } from 'expo-router';
import React from 'react';
import { TripForm } from '../../src/components/trip/TripForm';
import { createTrip } from '../../src/services/trips';

export default function NewTripScreen() {
  const router = useRouter();

  return (
    <TripForm
      submitTitle="建立行程"
      onSubmit={async (values) => {
        const trip = await createTrip(values);
        router.replace(`/trip/${trip.id}`);
      }}
    />
  );
}
