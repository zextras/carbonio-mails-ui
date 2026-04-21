/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import type { AttachmentAddActionConfig } from 'types/integrations/attachment-add-action';

type AttachmentAddActionStoreState = {
	integrations: Map<string, AttachmentAddActionConfig>;
	register: (config: AttachmentAddActionConfig) => void;
	unregister: (id: string) => void;
};

/**
 * Zustand store that holds all registered attachment-add-action integrations.
 *
 * Do not use this store directly to register integrations — call
 * registerAttachmentAddAction() instead, or use the shell-exposed function
 * 'register-attachment-add-action' from external modules.
 *
 * The store is initialized at module-import time, before any React rendering,
 * so external modules can safely call the registration function at any point
 * during their bootstrap sequence.
 */
export const useAttachmentAddActionStore = create<AttachmentAddActionStoreState>()((set) => ({
	integrations: new Map(),

	register: (config): void => {
		set((state) => ({
			integrations: new Map(state.integrations).set(config.id, config)
		}));
	},

	unregister: (id): void => {
		set((state) => {
			const next = new Map(state.integrations);
			next.delete(id);
			return { integrations: next };
		});
	}
}));

/** Clears all registrations. Intended for use in tests only. */
export const resetAttachmentAddActionStore = (): void =>
	useAttachmentAddActionStore.setState({ integrations: new Map() });
