use std::convert::Infallible;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[repr(i16)]
pub enum Role {
    Admin = 0,
}

impl From<Role> for i16 {
    fn from(value: Role) -> Self {
        value as i16
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[repr(i16)]
pub enum DocumentVersionRole {
    Owner = 0,
    Viewer = 1,
    Editor = 2,
    Reviewer = 3,
    Publisher = 4,
}

// TODO: handle a very unlikely case of invalid value properly
impl TryFrom<i16> for DocumentVersionRole {
    type Error = Infallible;

    fn try_from(value: i16) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::Owner),
            1 => Ok(Self::Viewer),
            2 => Ok(Self::Editor),
            3 => Ok(Self::Reviewer),
            4 => Ok(Self::Publisher),
            _ => unreachable!(),
        }
    }
}

impl From<DocumentVersionRole> for i16 {
    fn from(value: DocumentVersionRole) -> Self {
        value as i16
    }
}
