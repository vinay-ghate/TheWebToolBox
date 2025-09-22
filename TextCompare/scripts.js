document.addEventListener('alpine:init', () => {
    Alpine.data('textComparer', () => ({
        theme: 'dark',
        text1: 'This is the first line.\nThis is a common line.\nThis line is unique to the original text.',
        text2: 'This is the 1st line.\nThis is a common line.\nThis line is unique to the modified text.',
        stats1: { chars: 0, words: 0, lines: 0 },
        stats2: { chars: 0, words: 0, lines: 0 },
        options: {
            granularity: 'word',
            viewMode: 'side-by-side',
            isCaseSensitive: true,
            ignoreWhitespace: false,
        },
        results: {
            processed: false,
            unified: '',
            sideBySide: { left: '', right: '' },
            stats: { similarity: 0, added: 0, removed: 0 }
        },

        init() {
            this.theme = localStorage.getItem('theme') || 'dark';
            this.$watch('text1', () => this.calculateStats('text1'));
            this.$watch('text2', () => this.calculateStats('text2'));
            this.calculateStats('text1');
            this.calculateStats('text2');
        },

        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', this.theme);
        },

        calculateStats(target) {
            const text = this[target];
            this[target === 'text1' ? 'stats1' : 'stats2'] = {
                chars: text.length,
                words: text.trim().split(/\s+/).filter(Boolean).length,
                lines: text.split('\n').length
            };
        },

        handleFileUpload(event, target) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this[target] = e.target.result;
            };
            reader.readAsText(event.target.files[0]);
            event.target.value = '';
        },

        resetAll() {
            this.text1 = '';
            this.text2 = '';
            this.results = {
                processed: false,
                unified: '',
                sideBySide: { left: '', right: '' },
                stats: { similarity: 0, added: 0, removed: 0 }
            };
        },

        compareTexts() {
            let t1 = this.text1;
            let t2 = this.text2;

            if (!this.options.isCaseSensitive) {
                t1 = t1.toLowerCase();
                t2 = t2.toLowerCase();
            }
            if (this.options.ignoreWhitespace) {
                t1 = t1.replace(/\s+/g, ' ').trim();
                t2 = t2.replace(/\s+/g, ' ').trim();
            }

            if (t1 === t2) {
                this.results = {
                    processed: true,
                    unified: '<p class="text-center text-green-400">✅ No differences found!</p>',
                    sideBySide: {
                        left: '<p class="text-center text-green-400">✅ No differences found!</p>',
                        right: '<p class="text-center text-green-400">✅ No differences found!</p>'
                    },
                    stats: { similarity: 100, added: 0, removed: 0 }
                };
                return;
            }

            let diff;
            switch (this.options.granularity) {
                case 'character':
                    diff = Diff.diffChars(t1, t2);
                    break;
                case 'word':
                    diff = Diff.diffWordsWithSpace(t1, t2);
                    break;
                case 'line':
                    diff = Diff.diffLines(t1, t2, { newlineIsToken: true });
                    break;
                default:
                    diff = Diff.diffWordsWithSpace(t1, t2);
            }

            this.processDiffResults(diff, t1, t2);
        },

        escapeHtml(str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        processDiffResults(diff, t1, t2) {
            let unifiedHtml = '';
            let sideLeftHtml = '';
            let sideRightHtml = '';
            let addedCount = 0;
            let removedCount = 0;

            diff.forEach(part => {
                const escapedValue = this.escapeHtml(part.value);
                if (part.added) {
                    unifiedHtml += `<ins>${escapedValue}</ins>`;
                    sideRightHtml += `<ins>${escapedValue}</ins>`;
                    addedCount++;
                } else if (part.removed) {
                    unifiedHtml += `<del>${escapedValue}</del>`;
                    sideLeftHtml += `<del>${escapedValue}</del>`;
                    removedCount++;
                } else {
                    unifiedHtml += `<span>${escapedValue}</span>`;
                    sideLeftHtml += `<span>${escapedValue}</span>`;
                    sideRightHtml += `<span>${escapedValue}</span>`;
                }
            });

            const totalLength = Math.max(t1.length, t2.length);
            const diffLength = diff.filter(p => p.added || p.removed).reduce((sum, p) => sum + p.value.length, 0);
            const similarity = totalLength > 0 ? Math.round(((totalLength - diffLength) / totalLength) * 100) : 100;

            this.results = {
                processed: true,
                unified: unifiedHtml,
                sideBySide: { left: sideLeftHtml, right: sideRightHtml },
                stats: { similarity: Math.max(0, similarity), added: addedCount, removed: removedCount }
            };
        },

        exportResults() {
            let textContent = `--- TEXTBUDDY PRO COMPARISON REPORT ---\n`;
            textContent += `Similarity: ${this.results.stats.similarity}%\n`;
            textContent += `Differences Found (Added: ${this.results.stats.added}, Removed: ${this.results.stats.removed})\n`;
            textContent += `\n--- UNIFIED DIFF ---\n`;

            let diff = [];
            switch (this.options.granularity) {
                case 'character':
                    diff = Diff.diffChars(this.text1, this.text2);
                    break;
                case 'word':
                    diff = Diff.diffWordsWithSpace(this.text1, this.text2);
                    break;
                case 'line':
                    diff = Diff.diffLines(this.text1, this.text2);
                    break;
            }

            diff.forEach(part => {
                const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                textContent += prefix + part.value.replace(/\n/g, `\n${prefix}`);
            });

            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'comparison-report.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    }));
});