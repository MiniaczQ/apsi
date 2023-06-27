import { FunctionComponent } from 'react';
import { DocumentVersionState, DocumentVersionStateMap } from './DocumentVersion';
import { Badge } from 'react-bootstrap';
type StateBageProps = {
  state: DocumentVersionState | undefined;
};
export const StateBadge: FunctionComponent<StateBageProps> = (props) => {
  if (props.state === undefined) {
    return <></>;
  }
  const stateNameLUT: DocumentVersionStateMap<string> = {
    inProgress: 'In Progress',
    readyForReview: 'Ready For Review',
    reviewed: 'Reviewed',
    published: 'Published',
  };
  const stateStyleLUT: DocumentVersionStateMap<string> = {
    inProgress: 'primary',
    readyForReview: 'danger',
    reviewed: 'warning',
    published: 'success',
  };
  return (
    <Badge pill bg={stateStyleLUT[props.state]} className="ms-3">
      {stateNameLUT[props.state]}
    </Badge>
  );
};
