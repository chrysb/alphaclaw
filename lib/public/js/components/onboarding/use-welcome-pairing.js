import { useEffect, useState } from "https://esm.sh/preact/hooks";
import { approvePairing, fetchPairings, fetchStatus, rejectPairing } from "../../lib/api.js";
import { usePolling } from "../../hooks/usePolling.js";
import { isChannelPaired } from "./pairing-utils.js";

export const useWelcomePairing = ({
  isPairingStep = false,
  selectedPairingChannel = "",
} = {}) => {
  const [pairingError, setPairingError] = useState(null);
  const [pairingComplete, setPairingComplete] = useState(false);

  const pairingStatusPoll = usePolling(fetchStatus, 3000, {
    enabled: isPairingStep,
  });
  const pairingRequestsPoll = usePolling(
    async () => {
      const payload = await fetchPairings();
      const allPending = payload.pending || [];
      return allPending.filter((p) => p.channel === selectedPairingChannel);
    },
    1000,
    { enabled: isPairingStep && !!selectedPairingChannel },
  );
  const pairingChannels = pairingStatusPoll.data?.channels || {};
  const canFinishPairing = isChannelPaired(pairingChannels, selectedPairingChannel);

  useEffect(() => {
    if (isPairingStep && canFinishPairing) {
      setPairingComplete(true);
    }
  }, [isPairingStep, canFinishPairing]);

  const handlePairingApprove = async (id, channel, accountId = "") => {
    try {
      setPairingError(null);
      const result = await approvePairing(id, channel, accountId);
      if (!result.ok) throw new Error(result.error || "Could not approve pairing");
      setPairingComplete(true);
      pairingRequestsPoll.refresh();
      pairingStatusPoll.refresh();
    } catch (err) {
      setPairingError(err.message || "Could not approve pairing");
    }
  };

  const handlePairingReject = async (id, channel, accountId = "") => {
    try {
      setPairingError(null);
      const result = await rejectPairing(id, channel, accountId);
      if (!result.ok) throw new Error(result.error || "Could not reject pairing");
      pairingRequestsPoll.refresh();
    } catch (err) {
      setPairingError(err.message || "Could not reject pairing");
    }
  };

  const resetPairingState = () => {
    setPairingError(null);
    setPairingComplete(false);
  };

  return {
    pairingStatusPoll,
    pairingRequestsPoll,
    pairingChannels,
    canFinishPairing,
    pairingError,
    pairingComplete,
    handlePairingApprove,
    handlePairingReject,
    resetPairingState,
  };
};
