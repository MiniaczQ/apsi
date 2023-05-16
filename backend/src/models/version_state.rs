use std::convert::Infallible;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[repr(i16)]
pub enum DocumentVersionState {
    InProgress = 0,
    ReadyForReview = 1,
    Reviewed = 2,
    Published = 3,
}

// TODO: handle a very unlikely case of invalid value properly
impl TryFrom<i16> for DocumentVersionState {
    type Error = Infallible;

    fn try_from(value: i16) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::InProgress),
            1 => Ok(Self::ReadyForReview),
            2 => Ok(Self::Reviewed),
            3 => Ok(Self::Published),
            _ => unreachable!(),
        }
    }
}

impl From<DocumentVersionState> for i16 {
    fn from(value: DocumentVersionState) -> Self {
        value as i16
    }
}
