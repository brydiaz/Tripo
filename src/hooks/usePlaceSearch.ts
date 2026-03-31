import { useEffect, useRef, useState } from "react";
import { PlaceResult, searchPlaces } from "@/lib/geo";

export function usePlaceSearch(isDrivingMode: boolean) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    if (isDrivingMode) return;

    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");
        const results = await searchPlaces(query);

        if (requestId !== searchRequestIdRef.current) return;

        setSearchResults(results);
        setIsSearchOpen(true);

        if (results.length === 0) {
          setSearchError("No encontramos resultados para esa búsqueda.");
        }
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults([]);
        setSearchError("No se pudo completar la búsqueda.");
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, isDrivingMode]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    searchError,
    setSearchError,
    isSearchOpen,
    setIsSearchOpen,
  };
}
