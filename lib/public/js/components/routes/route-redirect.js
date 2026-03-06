import { useEffect } from "https://esm.sh/preact/hooks";
import { useLocation } from "https://esm.sh/wouter-preact";

export const RouteRedirect = ({ to }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};
