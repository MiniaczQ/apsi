import { DocumentVersionState } from "./DocumentVersion";

export type ChangeVersionState = {
    newState: DocumentVersionState,
    updatedAt: string,
}

export default ChangeVersionState;