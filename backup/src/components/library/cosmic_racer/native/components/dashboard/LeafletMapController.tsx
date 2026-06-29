"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
    center: [number, number];
    zoom: number;
}

const LeafletMapController = ({ center, zoom }: MapControllerProps) => {
    const map = useMap();

    useEffect(() => {
        if (map) {
            map.flyTo(center, zoom, {
                duration: 2.0, // Smooth 2s flight
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);

    return null;
};

export default LeafletMapController;
