import { FunctionComponent, KeyboardEventHandler, useEffect, useState } from 'react';
import { Container, Button, Badge } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { DocumentVersionMember, DocumentVersionMemberRole } from '../models/DocumentVersionMember';
import { LoginState } from '../App';
import CommentEditor from './CommentEditor';
import Comment from '../models/Comment';
import { compareByCreationTime } from '../documents/Documents';

type CommentsProps = {
  loginState: LoginState;
  apiClient: ApiClient;
  documentId: string;
  versionId: string;
};

type DocumentVersionMemberRoleStateMap<Type> = {
  [key in DocumentVersionMemberRole]: Type;
};

const getStateBadge = (state: DocumentVersionMemberRole | undefined) => {
  if (state) {
    const stateNameLUT: DocumentVersionMemberRoleStateMap<string> = {
      owner: 'Owner',
      viewer: 'Viewer',
      reviewer: 'Reviewer',
      editor: 'Editor',
    };
    const stateStyleLUT: DocumentVersionMemberRoleStateMap<string> = {
      owner: 'primary',
      viewer: 'danger',
      reviewer: 'warning',
      editor: 'success',
    };
    return (
      <Badge key={state} pill bg={stateStyleLUT[state]}>
        {stateNameLUT[state]}
      </Badge>
    );
  }
  return <></>;
};

export const Comments: FunctionComponent<CommentsProps> = ({ loginState, apiClient, documentId, versionId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [formComment, setFormComment] = useState<string>();
  const [documentVersionMember, setDocumentVersionMember] = useState<DocumentVersionMember[]>([]);
  const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

  const createComment = async () => {
    if (formComment === undefined || formComment.length === 0) return;
    const createdComment = await apiClient.createComment(documentId, versionId, { content: formComment });
    setComments([...comments, createdComment]);
    setFormComment(undefined);
  };

  const handleEnter: KeyboardEventHandler<HTMLDivElement> = async (evt) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      await createComment();
    }
  };

  const renderButton = () => {
    if (
      documentVersionMember
        .find((memeber) => memeber.userId === loginState.userId)
        ?.roles.some((role) => ['owner', 'editor', 'reviewer'].includes(role))
    ) {
      return (
        <div onKeyDown={handleEnter}>
          <CommentEditor value={formComment ?? ''} disabled={false} onChange={setFormComment} />
          <Button className="w-100" type="submit" onClick={createComment}>
            Create
          </Button>
        </div>
      );
    }
    return <></>;
  };

  useEffect(() => {
    apiClient
      .loadComments(documentId, versionId)
      .then((response) => setComments(response.sort((a, b) => -compareByCreationTime(a, b))));
    apiClient.getVersionMembers(documentId, versionId).then((response) => setDocumentVersionMember(response));
  }, [apiClient, documentId, versionId]);

  const renderComment = (comment: Comment) => {
    return (
      <div className={'my-3'} key={comment.commentId}>
        {documentVersionMember.find((member) => member.userId === comment.userId)?.roles.map((role) => getStateBadge(role))}
        <b className="ms-3">{comment.username}</b>
        <span className="ms-3">{getFormattedDate(comment.createdAt)}</span>
        <br />
        <div className="ms-3">{comment.content}</div>
      </div>
    );
  };

  return (
    <Container>
      {comments.map((comment) => renderComment(comment))}
      {renderButton()}
    </Container>
  );
};

export default Comments;
