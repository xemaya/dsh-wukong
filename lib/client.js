window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-wukong",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0dsh-css:src/client/wukong.module.css.mjs
		const css = "body[data-dsh-wukong]{background:#080706}";
		const tagId = "@dsh-external/dsh-wukong/wukong.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-wukong";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		function apply(ctx) {
			const body = document.body;
			ctx.effect(() => () => {
				delete body.dataset.dshWukong;
			}, "ui-skin-wukong: presentation layer");
			body.dataset.dshWukong = "";
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map