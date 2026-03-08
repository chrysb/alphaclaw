import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { kGithubFlowFresh, kGithubFlowImport } from "./welcome-config.js";

const html = htm.bind(h);

export const WelcomePreStep = ({ onSelectFlow }) => {
  return html`
    <div class="space-y-3">
      <button
        type="button"
        onclick=${() => onSelectFlow(kGithubFlowFresh)}
        class="w-full flex items-center gap-4 text-left p-4 rounded-xl ac-path-card"
      >
        <div
          class="ac-path-icon flex-shrink-0 w-10 h-10 flex items-center justify-center bg-black/30 rounded-lg border border-border text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              d="M14 4.4375C15.3462 4.4375 16.4375 3.34619 16.4375 2H17.5625C17.5625 3.34619 18.6538 4.4375 20 4.4375V5.5625C18.6538 5.5625 17.5625 6.65381 17.5625 8H16.4375C16.4375 6.65381 15.3462 5.5625 14 5.5625V4.4375ZM1 11C4.31371 11 7 8.31371 7 5H9C9 8.31371 11.6863 11 15 11V13C11.6863 13 9 15.6863 9 19H7C7 15.6863 4.31371 13 1 13V11ZM4.87601 12C6.18717 12.7276 7.27243 13.8128 8 15.124 8.72757 13.8128 9.81283 12.7276 11.124 12 9.81283 11.2724 8.72757 10.1872 8 8.87601 7.27243 10.1872 6.18717 11.2724 4.87601 12ZM17.25 14C17.25 15.7949 15.7949 17.25 14 17.25V18.75C15.7949 18.75 17.25 20.2051 17.25 22H18.75C18.75 20.2051 20.2051 18.75 22 18.75V17.25C20.2051 17.25 18.75 15.7949 18.75 14H17.25Z"
            ></path>
          </svg>
        </div>
        <div>
          <div
            class="ac-path-title text-sm font-medium text-gray-200 mb-0.5 transition-colors duration-150"
          >
            Start fresh
          </div>
          <div
            class="ac-path-desc text-xs text-gray-500 transition-colors duration-150"
          >
            Create a new repository and set up your agent from scratch.
          </div>
        </div>
      </button>

      <button
        type="button"
        onclick=${() => onSelectFlow(kGithubFlowImport)}
        class="w-full flex items-center gap-4 text-left p-4 rounded-xl ac-path-card"
      >
        <div
          class="ac-path-icon flex-shrink-0 w-10 h-10 flex items-center justify-center bg-black/30 rounded-lg border border-border text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div>
          <div
            class="ac-path-title text-sm font-medium text-gray-200 mb-0.5 transition-colors duration-150"
          >
            Import existing setup
          </div>
          <div
            class="ac-path-desc text-xs text-gray-500 transition-colors duration-150"
          >
            Connect an existing repository that already has an OpenClaw setup.
          </div>
        </div>
      </button>
    </div>
  `;
};
