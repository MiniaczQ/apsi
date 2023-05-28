import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { Container, Button, Badge } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { DocumentVersionMemberRole } from '../models/DocumentVersionMember';
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
    if (state === undefined) {
      return <></>
    }
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

export const Comments: FunctionComponent<CommentsProps> = ({ loginState, apiClient, documentId, versionId }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [formComment, setFormComment] = useState<Comment>()

  const getFormattedDate = (createdAt: string) => {
    const date = new Date(createdAt);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  }

  const createComment = (comment: string) => {
    const userRoles = comments.find(currentComment => currentComment.userRoles.userId == loginState.userId)
    return {
        documentId: documentId,
        versionId: versionId,
        userRoles: userRoles?.userRoles!,
        content: comment,
        createdAt: new Date().toISOString()
    }

  }

  const renderButton = () => {
    let render = false;
    comments.forEach(coment => {
        if(coment.userRoles.userId == loginState.userId){
            if(coment.userRoles.roles.some(role => ['owner','editor','reviewer'].includes(role))){
                render = true;
            }
        }
      })
    if(render){
        return (<div><CommentEditor defaultValue={""} disabled={false} onChange={comment => setFormComment(createComment(comment))} />
        <Button className="w-100" type="submit" onClick={event => {
            if(formComment !== undefined && formComment.content != ""){
                setComments([...comments, formComment!]);
                //apiClient.createComment(formComment);
            }
    }}>Create</Button></div>);
    }
    return <div/>;
}

  const loadComments = useCallback((documentId: string, versionId: string) => {
    setComments([
        {
            documentId: "65a45040-f418-11ed-a05b-0242ac120003",
            versionId: "65a45040-f418-11ed-a05b-0242ac120003",
            userRoles: {
                userId: "81721217-8f19-4c3b-8b25-a2af68875018",
                username: "admin",
                roles: ["editor"]
            },
            content: "string",
            createdAt: "2023-05-25T17:25:30.210908Z"
        },
    ])
    //  apiClient.loadComments(documentId, versionId)
    //    .then(response => setComments(response));
  }, [apiClient]);

  useEffect(
    () => loadComments(documentId, versionId),
    [loadComments, documentId, versionId]
  );

  const renderComment = (comment: Comment) => {
    return (<p key={comment.content}>
        {comment.userRoles.roles.map(role => getStateBadge(role))}
        <b className="ms-3">{comment.userRoles.username}</b>
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