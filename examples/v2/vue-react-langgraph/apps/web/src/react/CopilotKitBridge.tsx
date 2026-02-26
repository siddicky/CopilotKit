import { useEffect, useRef, useState } from "react";
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import {
  CopilotSidebar,
  type CopilotKitCSSProperties,
} from "@copilotkit/react-ui";
import { useInterrupt } from "@copilotkit/react-core/v2";
import type { AgentState, VueToReactBridge, StateBridge } from "../bridge/types";

interface BridgeProps {
  vueToReactBridge: VueToReactBridge;
  stateBridge: StateBridge;
}

/**
 * React component that wires all CopilotKit hooks and renders the CopilotSidebar.
 * Acts as the bridge between the Vue host and the CopilotKit agent.
 *
 * Responsibilities:
 * - useCoAgent: bidirectional shared state with the LangGraph agent
 * - useInterrupt: handles LangGraph interrupt() for human-in-the-loop
 * - useCopilotAction: registers frontend tools (setThemeColor, addProverb, getWeather)
 * - State bridge: syncs agent state changes to Vue and accepts state updates from Vue
 */
export function CopilotKitBridge({
  vueToReactBridge,
  stateBridge,
}: BridgeProps) {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // Shared state with the LangGraph agent
  const { state, setState } = useCoAgent<AgentState>({
    name: "default",
    initialState: vueToReactBridge.initialState,
  });

  // --- State Bridge: React → Vue ---
  // Expose setAgentState so Vue can push state changes into useCoAgent
  const setStateRef = useRef(setState);
  setStateRef.current = setState;

  useEffect(() => {
    stateBridge.reactApi = {
      setAgentState: (newState: AgentState) => {
        setStateRef.current(newState);
      },
    };
    return () => {
      stateBridge.reactApi = null;
    };
  }, [stateBridge]);

  // --- State Bridge: Agent → Vue ---
  // Notify Vue whenever agent state changes (with loop prevention)
  const prevStateRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized !== prevStateRef.current) {
      prevStateRef.current = serialized;
      vueToReactBridge.onAgentStateChanged(state);
    }
  }, [state, vueToReactBridge]);

  // --- Frontend Action: Set Theme Color ---
  useCopilotAction({
    name: "setThemeColor",
    description: "Set the theme color of the page.",
    parameters: [
      {
        name: "themeColor",
        description: "The theme color to set. Make sure to pick nice colors.",
        required: true,
      },
    ],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  // --- Frontend Action: Add Proverb ---
  useCopilotAction(
    {
      name: "addProverb",
      description: "Add a proverb to the list.",
      parameters: [
        {
          name: "proverb",
          description:
            "The proverb to add. Make it witty, short and concise.",
          required: true,
        },
      ],
      handler: ({ proverb }) => {
        setState((prevState) => ({
          ...prevState,
          proverbs: [...(prevState?.proverbs || []), proverb],
        }));
      },
    },
    [setState],
  );

  // --- Frontend Action: Get Weather (Generative UI) ---
  useCopilotAction({
    name: "getWeather",
    description: "Get the weather for a given location.",
    available: "disabled",
    parameters: [{ name: "location", type: "string", required: true }],
    render: ({ args }) => {
      return <WeatherCard location={args.location} themeColor={themeColor} />;
    },
  });

  // --- LangGraph Interrupt Handler ---
  useInterrupt({
    render: ({ event, resolve }) => {
      const { message } = event.value as {
        message: string;
        proverb: string;
        action: string;
      };

      return (
        <div
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "16px",
            margin: "8px 0",
          }}
        >
          <p
            style={{
              fontWeight: 500,
              color: "#92400e",
              marginBottom: "4px",
              fontSize: "14px",
            }}
          >
            Confirmation Required
          </p>
          <p
            style={{
              color: "#a16207",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => resolve({ approved: true })}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                backgroundColor: "#ef4444",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Yes, delete it
            </button>
            <button
              onClick={() => resolve({ approved: false })}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    },
  });

  // Render only the CopilotSidebar — main content is owned by Vue
  return (
    <div
      style={
        { "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties
      }
    >
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Vue + CopilotKit Assistant",
          initial:
            "Hi! This is CopilotKit running as a React micro-frontend inside a Vue.js app.\n\nTry:\n- **Shared State**: \"Write a proverb about AI\"\n- **Interrupts**: \"Delete the first proverb\" (will ask for confirmation)\n- **Frontend Tools**: \"Set the theme to orange\"\n- **Generative UI**: \"Get the weather in SF\"\n\nThe proverb list is rendered by Vue and synchronized bidirectionally with the CopilotKit agent state.",
        }}
      />
    </div>
  );
}

/** Weather card component rendered as generative UI inside the chat. */
function WeatherCard({
  location,
  themeColor,
}: {
  location?: string;
  themeColor: string;
}) {
  return (
    <div
      style={{
        backgroundColor: themeColor,
        borderRadius: "12px",
        boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
        marginTop: "24px",
        marginBottom: "16px",
        maxWidth: "28rem",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "white",
                textTransform: "capitalize",
              }}
            >
              {location}
            </h3>
            <p style={{ color: "white" }}>Current Weather</p>
          </div>
          <span style={{ fontSize: "48px" }}>&#9728;&#65039;</span>
        </div>
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{ fontSize: "30px", fontWeight: "bold", color: "white" }}
          >
            70&deg;
          </div>
          <div style={{ fontSize: "14px", color: "white" }}>Clear skies</div>
        </div>
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              textAlign: "center",
            }}
          >
            <div>
              <p style={{ color: "white", fontSize: "12px" }}>Humidity</p>
              <p style={{ color: "white", fontWeight: 500 }}>45%</p>
            </div>
            <div>
              <p style={{ color: "white", fontSize: "12px" }}>Wind</p>
              <p style={{ color: "white", fontWeight: 500 }}>5 mph</p>
            </div>
            <div>
              <p style={{ color: "white", fontSize: "12px" }}>Feels Like</p>
              <p style={{ color: "white", fontWeight: 500 }}>72&deg;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
