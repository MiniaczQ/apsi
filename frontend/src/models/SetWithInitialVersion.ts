import Set from "./Set";
import SetVersion from "./SetVersion";

type SetWithInitialVersion = {
    document: Set;
    initialVersion: SetVersion;
};

export default SetWithInitialVersion;
