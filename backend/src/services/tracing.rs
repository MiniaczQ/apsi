use std::path::PathBuf;

use serde::Deserialize;
use tracing::metadata::LevelFilter;
use tracing_appender::rolling::hourly;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

use super::config::Config;

#[derive(Debug, Clone, Deserialize)]
pub struct TracingConfig {
    pub console: bool,
    pub json_directory: Option<PathBuf>,
    pub directives: Vec<String>,
}

pub fn setup_tracing(config: &Config) {
    let mut layers = Vec::new();

    let directives = prepare_filter_directives(config);
    let env_filter = tracing_subscriber::EnvFilter::builder()
        .with_default_directive(LevelFilter::TRACE.into())
        .parse(directives)
        .expect("Invalid tracing directives");

    if config.tracing.console {
        let console = tracing_subscriber::fmt::layer().pretty().boxed();
        layers.push(console);
    }

    if let Some(directory) = &config.tracing.json_directory {
        let json = tracing_subscriber::fmt::layer()
            .json()
            .with_writer(hourly(directory, "webserver"))
            .boxed();
        layers.push(json);
    }

    tracing_subscriber::registry()
        .with(env_filter)
        .with(layers)
        .init();
}

fn prepare_filter_directives(config: &Config) -> String {
    if !config.tracing.directives.is_empty() {
        let mut directives = config.tracing.directives.iter();
        let first_directive = directives.next().unwrap().to_owned();
        directives.fold(first_directive, |directives, directive| {
            directives + "," + directive.as_ref()
        })
    } else {
        "".to_owned()
    }
}
