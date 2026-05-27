import { useEffect } from "preact/hooks";
import { useLocation } from "wouter-preact";

export const RouteRedirect = ({ to }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};
