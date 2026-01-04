import { ZeppWidget, WidgetType } from '../types';

export const generateZeppCode = (widgets: ZeppWidget[]): string => {
  const hasTodoList = widgets.some(w => w.type === WidgetType.TODO_LIST);
  const hasVoice = widgets.some(w => w.type === WidgetType.VOICE_BUTTON);

  const widgetCode = widgets.map(w => {
    let propsString = '';
    const p = w.props;
    
    switch (w.type) {
      case WidgetType.TEXT:
        propsString = `{
        x: ${p.x},
        y: ${p.y},
        w: ${p.w},
        h: ${p.h},
        text: "${p.text || ''}",
        text_size: ${p.text_size || 36},
        color: ${p.color ? `0x${p.color.replace('#', '')}` : '0xffffff'},
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V
      }`;
        return `    hmUI.createWidget(hmUI.widget.TEXT, ${propsString});`;

      case WidgetType.BUTTON:
        propsString = `{
        x: ${p.x},
        y: ${p.y},
        w: ${p.w},
        h: ${p.h},
        text: "${p.text || ''}",
        text_size: ${p.text_size || 30},
        normal_color: ${p.normal_color ? `0x${p.normal_color.replace('#', '')}` : '0x262626'},
        press_color: ${p.press_color ? `0x${p.press_color.replace('#', '')}` : '0x1a1a1a'},
        radius: ${p.radius || 12},
        click_func: () => {
          console.log("Button ${w.name} clicked");
        }
      }`;
        return `    hmUI.createWidget(hmUI.widget.BUTTON, ${propsString});`;

      case WidgetType.CIRCLE:
        propsString = `{
        center_x: ${p.x + (p.w / 2)},
        center_y: ${p.y + (p.h / 2)},
        radius: ${p.w / 2},
        color: ${p.color ? `0x${p.color.replace('#', '')}` : '0xff0000'}
      }`;
        return `    hmUI.createWidget(hmUI.widget.CIRCLE, ${propsString});`;

      case WidgetType.RECT:
          propsString = `{
          x: ${p.x},
          y: ${p.y},
          w: ${p.w},
          h: ${p.h},
          color: ${p.color ? `0x${p.color.replace('#', '')}` : '0xff0000'},
          radius: ${p.radius || 0}
        }`;
        return `    hmUI.createWidget(hmUI.widget.FILL_RECT, ${propsString});`;

      case WidgetType.VOICE_BUTTON:
        // Voice button using IMG or BUTTON
        propsString = `{
        x: ${p.x},
        y: ${p.y},
        w: ${p.w},
        h: ${p.h},
        text: "MIC",
        text_size: 24,
        normal_color: ${p.normal_color ? `0x${p.normal_color.replace('#', '')}` : '0xef4444'},
        press_color: 0x991b1b,
        radius: ${p.w / 2},
        click_func: () => {
           this.startVoiceInput();
        }
      }`;
        return `    hmUI.createWidget(hmUI.widget.BUTTON, ${propsString});`;

      case WidgetType.TODO_LIST:
        // SCROLL_LIST is complex. Generating a simplified version with a comment.
        return `    /* 
     * TODO LIST WIDGET 
     * API: ${p.api_endpoint || 'https://api.todoist.com/rest/v2/tasks'}
     */
    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
      x: ${p.x},
      y: ${p.y},
      w: ${p.w},
      h: ${p.h},
      item_space: 10,
      item_config: [
        {
          type_id: 1,
          item_bg_color: 0x333333,
          item_bg_radius: 10,
          text_view: [{ x: 50, y: 0, w: 200, h: 50, key: 'name', color: 0xffffff, text_size: 24 }],
          text_view_count: 1,
          image_view: [{ x: 10, y: 10, w: 30, h: 30, key: 'icon' }],
          image_view_count: 1,
        }
      ],
      item_config_count: 1,
      data_array: this.state.tasks || [{name: 'Connect to API', icon: ''}],
      data_count: (this.state.tasks && this.state.tasks.length) || 1,
      item_click_func: (list, index) => {
        console.log("Task clicked", index);
      }
    });`;

      default:
        return ``;
    }
  }).join('\n\n');

  // Helper code for API and Voice
  const todoistHelper = hasTodoList ? `
  // FETCH TASKS FROM TODOIST (Requires 'internet' permission in app.json)
  fetchTasks() {
    const url = "${widgets.find(w => w.type === WidgetType.TODO_LIST)?.props.api_endpoint || 'https://api.todoist.com/rest/v2/tasks'}";
    const token = "YOUR_TODOIST_API_TOKEN"; 

    // Note: Zepp OS fetch might require the 'fetch' API plugin or companion app side
    // This example assumes standard fetch availability or polyfill
    fetch({
      url: url,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then((response) => {
      // Parse tasks and update SCROLL_LIST
      // this.state.tasks = response.body.map(t => ({name: t.content, icon: ''}));
      // hmUI.setLayerScrolling(true); // refresh UI
    }).catch(e => console.log('Fetch error', e));
  },
` : '';

  const voiceHelper = hasVoice ? `
  // VOICE INPUT HANDLER
  startVoiceInput() {
    console.log("Starting voice input...");
    // Zepp OS 3.0+ may support voice recording APIs or invoking system assistants.
    // Example: hmApp.startApp({ url: 'VoiceRecorder', ... }) or using AI Service.
    
    // For "AI Task Creation", typically you record audio, upload to backend (Whisper), 
    // parse intent (LLM), and call Todoist API.
    
    hmUI.showToast({ text: "Listening..." });
  },
` : '';

  return `/* 
 * Generated by ZeppBuilder AI
 * Target Device: Amazfit Balance (480x480)
 * File: page/index.js
 */

Page({
  state: {
    tasks: []
  },

  build() {
    console.log("App Starting");
    
${widgetCode}

    ${hasTodoList ? 'this.fetchTasks();' : ''}
  },
  
  onDestroy() {
    // Cleanup
  },

${todoistHelper}
${voiceHelper}
});
`;
};

export const generateAppJson = (widgets: ZeppWidget[]): string => {
    const hasTodoList = widgets.some(w => w.type === WidgetType.TODO_LIST);
    const hasVoice = widgets.some(w => w.type === WidgetType.VOICE_BUTTON);
    
    const permissions = [];
    if (hasTodoList) permissions.push("internet");
    if (hasVoice) permissions.push("audio_record");
  
    const appConfig = {
      config: {
        appId: Math.floor(Math.random() * 1000000) + 1000000,
        appName: "My AI App",
        version: {
          code: 1,
          name: "1.0.0"
        },
        icon: "icon.png",
        vendor: "ZeppBuilder",
        description: "Generated by ZeppBuilder AI"
      },
      permissions: permissions,
      targets: {
        "all": {
          module: {
            page: {
              pages: [
                "page/index"
              ]
            },
            app: {
              js: "app"
            }
          }
        }
      }
    };
  
    return JSON.stringify(appConfig, null, 2);
  };

export const generateReadme = (): string => {
  return `# Zepp OS AI App

Generated by ZeppBuilder AI.

## Project Structure

- \`app.json\`: Application configuration and permissions.
- \`page/index.js\`: Main application logic and UI layout.

## Setup Instructions

1. **Install Zepp OS CLI**: Ensure you have the Zeus CLI installed.
2. **Create Project**: Run \`zeus create your-project-name\` and select "Empty" template.
3. **Copy Files**: 
   - Replace the generated \`app.json\` with the one in this archive.
   - Replace \`page/index.js\` with the file in the \`page/\` folder of this archive.
4. **Permissions**: 
   - If using Todoist, ensure you add your API Token in \`page/index.js\`.
   - Voice features may require additional companion app setup depending on the implementation strategy.

## Build & Run

Run \`zeus dev\` to start the simulator.
`;
};
