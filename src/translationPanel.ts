import * as vscode from 'vscode';

export class TranslationTreeProvider implements vscode.TreeDataProvider<TranslationItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TranslationItem | undefined | null | void> = new vscode.EventEmitter<TranslationItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TranslationItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentLanguage: string = 'ta';
    private htmlMap: Record<string, string> = {};

    constructor() {
        this.loadLanguage('ta');
    }

    loadLanguage(code: string) {
        this.currentLanguage = code;
        const compiler = require('./compiler');
        compiler.loadLocale(code);
        this.htmlMap = { ...compiler.htmlMap };
        this._onDidChangeTreeData.fire();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TranslationItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TranslationItem): Thenable<TranslationItem[]> {
        if (!element) {
            // Root level - show categories
            return Promise.resolve([
                new TranslationItem('HTML Tags', '', vscode.TreeItemCollapsibleState.Expanded, true),
                new TranslationItem('CSS Properties', '', vscode.TreeItemCollapsibleState.Expanded, true)
            ]);
        }

        if (element.isCategory) {
            if (element.label === 'HTML Tags') {
                const items = Object.entries(this.htmlMap).map(([native, eng]) => 
                    new TranslationItem(
                        native,
                        eng as string,
                        vscode.TreeItemCollapsibleState.None,
                        false
                    )
                );
                return Promise.resolve(items);
            } else {
                // CSS Properties
                const compiler = require('./compiler');
                const items = Object.entries(compiler.cssMap).map(([native, eng]) => 
                    new TranslationItem(
                        native,
                        eng as string,
                        vscode.TreeItemCollapsibleState.None,
                        false
                    )
                );
                return Promise.resolve(items);
            }
        }

        return Promise.resolve([]);
    }
}

class TranslationItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isCategory: boolean
    ) {
        super(label, collapsibleState);
        this.tooltip = isCategory ? label : `${label} → ${description}`;
        this.description = description;
        
        if (!isCategory) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
        }
    }
}

export function registerTranslationPanel(context: vscode.ExtensionContext): TranslationTreeProvider {
    const treeDataProvider = new TranslationTreeProvider();
    
    const treeView = vscode.window.createTreeView('bharatTranslations', {
        treeDataProvider: treeDataProvider
    });

    context.subscriptions.push(treeView);

    // Command to refresh
    const refreshCommand = vscode.commands.registerCommand('thtml.refreshTranslations', () => {
        treeDataProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    return treeDataProvider;
}
