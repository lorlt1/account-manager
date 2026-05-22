<script setup lang="ts">
import { onHide, onLaunch, onShow } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("App Launch");
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
page {
  min-height: 100%;
  background: #fbf8ef;
  color: #161616;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
    "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
input,
button,
textarea {
  box-sizing: border-box;
}

button {
  border: 0;
  margin: 0;
}

button::after {
  border: 0;
}
</style>
