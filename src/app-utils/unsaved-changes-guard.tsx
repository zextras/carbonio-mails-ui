/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useHasDirtyEditors } from 'store/editor/hooks/statuses';

/**
 * Asks the browser to confirm with the user before leaving the page while at
 * least one editor holds changes which haven't been persisted in a draft yet.
 *
 * The guard is installed as soon as a change books a draft save and it is
 * removed once the draft save completes successfully (or the editor is closed).
 * If the user decides to leave the page the pending changes are lost, since
 * the confirmation outcome isn't exposed to the page.
 */
export const UnsavedChangesGuard = (): null => {
	const hasDirtyEditors = useHasDirtyEditors();

	useEffect(() => {
		if (!hasDirtyEditors) {
			return undefined;
		}

		const onBeforeUnload = (event: BeforeUnloadEvent): void => {
			event.preventDefault();
		};

		window.addEventListener('beforeunload', onBeforeUnload);
		return (): void => {
			window.removeEventListener('beforeunload', onBeforeUnload);
		};
	}, [hasDirtyEditors]);

	return null;
};
