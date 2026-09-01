/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	ensureInlineImagesConverted,
	registerInlineImageConverter
} from 'views/app/detail-panel/edit/editor/plugins/inline-image-conversion-registry';

const EDITOR_ID = 'editor-1';

describe('inline image conversion registry', () => {
	it('resolves when no editor is registered, so the send is never blocked', async () => {
		await expect(ensureInlineImagesConverted('never-registered')).resolves.toBeUndefined();
	});

	it('delegates to the registered converter', async () => {
		const ensureConverted = vi.fn().mockResolvedValue(undefined);
		const unregister = registerInlineImageConverter(EDITOR_ID, ensureConverted);

		await ensureInlineImagesConverted(EDITOR_ID);

		expect(ensureConverted).toHaveBeenCalledTimes(1);
		unregister();
	});

	it('stops delegating once the editor unmounts', async () => {
		const ensureConverted = vi.fn().mockResolvedValue(undefined);
		const unregister = registerInlineImageConverter(EDITOR_ID, ensureConverted);

		unregister();
		await ensureInlineImagesConverted(EDITOR_ID);

		expect(ensureConverted).not.toHaveBeenCalled();
	});

	it('keeps the converters of the other editors isolated', async () => {
		const first = vi.fn().mockResolvedValue(undefined);
		const second = vi.fn().mockResolvedValue(undefined);
		const unregisterFirst = registerInlineImageConverter('editor-a', first);
		const unregisterSecond = registerInlineImageConverter('editor-b', second);

		await ensureInlineImagesConverted('editor-b');

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
		unregisterFirst();
		unregisterSecond();
	});

	it('does not let a stale unregister drop the converter of a remounted editor', async () => {
		const stale = vi.fn().mockResolvedValue(undefined);
		const current = vi.fn().mockResolvedValue(undefined);
		const unregisterStale = registerInlineImageConverter(EDITOR_ID, stale);
		const unregisterCurrent = registerInlineImageConverter(EDITOR_ID, current);

		// React can run the previous effect's cleanup after the new one registered.
		unregisterStale();
		await ensureInlineImagesConverted(EDITOR_ID);

		expect(current).toHaveBeenCalledTimes(1);
		unregisterCurrent();
	});
});
