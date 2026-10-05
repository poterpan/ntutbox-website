/* 法律文件的內容結構。文字只放在 src/content/legal/*.ts，元件不寫死文案；
   之後加英文版＝再寫一份同形狀的內容檔，不必動元件。

   行內語法（由 LegalRichText 解析）：
   - 連結：[文字](/terms/)、[文字](mailto:…)、[文字](https://…)
   - 待確認標記：【待確認：…】、【待補：…】會醒目顯示，check-site 會擋下仍含標記的建置。 */

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export type LegalSection = {
  /** 段落錨點，例如 /privacy/#member；改了會打斷外部連結 */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  title: string;
  /** App 與後端記錄同意時存的版本字串；內容有任何修改就換新值 */
  version: string;
  updated: string;
  metaDescription: string;
  summary?: LegalBlock[];
  sections: LegalSection[];
};
