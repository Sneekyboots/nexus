import { useContext } from "react";
import { NexusContext } from "../context/NexusContext";

export const useNexus = () => useContext(NexusContext);
