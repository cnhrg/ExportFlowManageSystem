import {createApp} from 'vue';
import App from './Workspace.vue';
import 'element-plus/dist/index.css';
import './workspace.css';

const host = document.getElementById('entrance-demo');
if (host) createApp(App).mount(host);
