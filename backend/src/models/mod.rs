pub mod attachment;
pub mod comment;
pub mod document;
pub mod document_set;
pub mod role;
pub mod set_version;
pub mod user;
pub mod version;
pub mod version_state;

use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    static ref VERSION_NAME_REGEX: Regex = Regex::new(r"^\d+(\.\d+)*$").unwrap();
}
