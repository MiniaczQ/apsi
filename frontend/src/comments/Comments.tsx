import { FunctionComponent, useEffect, useState } from 'react';
import { Container, Button, Badge } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { DocumentVersionMember, DocumentVersionMemberRole } from '../models/DocumentVersionMember';
import { LoginState } from '../App';
import CommentEditor from './CommentEditor';
import Comment from './Comment';

type CommentsProps = {
  loginState: LoginState,
  apiClient: ApiClient,
  documentId: string,
  versionId: string,
};



type DocumentVersionMemberRoleStateMap<Type> = {
    [key in DocumentVersionMemberRole]: Type;
};

const getStateBadge = (state: DocumentVersionMemberRole | undefined) => {
    if (state) {
      const stateNameLUT: DocumentVersionMemberRoleStateMap<string> = {
        'owner': 'Owner',
        'viewer': 'Viewer',
        'reviewer': 'Reviewer',
        'editor': 'Editor',
      };
      const stateStyleLUT: DocumentVersionMemberRoleStateMap<string> = {
        'owner': 'primary',
        'viewer': 'danger',
        'reviewer': 'warning',
        'editor': 'success',
      };
      return <Badge pill bg={stateStyleLUT[state]}>
        {stateNameLUT[state]}
      </Badge>
    }
    return <></>
  }

export const Comments: FunctionComponent<CommentsProps> = ({ loginState, apiClient, documentId, versionId }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [formComment, setFormComment] = useState<Comment>()
  const [documentVersionMember, setDocumentVersionMember] = useState<DocumentVersionMember[]>([])
  const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

  const createComment = (comment: string): Comment => {
    return {
        commentId: '',
        userId: loginState.userId,
        username: loginState.username,
        content: comment,
        createdAt: new Date().toISOString()
    } as Comment

  }

  const renderButton = () => {
    if(documentVersionMember.find(memeber => memeber.userId === loginState.userId)?.roles.some(role => ['owner','editor','reviewer'].includes(role))){
        return (<div><CommentEditor defaultValue={""} disabled={false} onChange={comment => setFormComment(createComment(comment))} />
        <Button className="w-100" type="submit" onClick={event => {
            if(formComment && formComment.content !== "" ){
                setComments([...comments, formComment!]);
                apiClient.createComment(formComment,documentId, versionId);
            }
    }}>Create</Button></div>);
    }
    return <div/>;
}

  useEffect(
    () => {
      apiClient.loadComments(documentId, versionId)
      .then(response => setComments(response))
      apiClient.getVersionMembers(documentId,versionId)
      .then(response => setDocumentVersionMember(response))
    },
    [apiClient, documentId, versionId]
  );

  const renderComment = (comment: Comment) => {
    return (<p key={comment.content}>
        {documentVersionMember.find(member => member.userId === comment.userId)?.roles.map(role => getStateBadge(role))}
        <b className="ms-3">{loginState.username}</b>
        <span className="ms-3">{getFormattedDate(comment.createdAt)}</span>
        <br/> 
        <div className="ms-3">{comment.content}</div>
    </p>);
  }

  return (
    <Container>
      {comments.map(comment => renderComment(comment))}
      {renderButton()}
    </Container>
  );
}

export default Comments;