/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import type { ComposerIntegrationConfig } from 'types/integrations/composer-integration';

type ComposerIntegrationStoreState = {
	integrations: Map<string, ComposerIntegrationConfig>;
	register: (config: ComposerIntegrationConfig) => void;
	unregister: (id: string) => void;
	/** Clears all registrations. Intended for use in tests only. */
	reset: () => void;
};

/**
 * Zustand store that holds all registered composer integrations.
 *
 * Do not use this store directly to register integrations — call
 * registerComposerIntegration() instead, or use the shell-exposed function
 * 'register-composer-integration' from external modules.
 *
 * The store is initialized at module-import time, before any React rendering,
 * so external modules can safely call the registration function at any point
 * during their bootstrap sequence.
 */
export const useComposerIntegrationStore = create<ComposerIntegrationStoreState>()((set) => ({
	integrations: new Map(),

	register: (config) =>
		set((state) => ({
			integrations: new Map(state.integrations).set(config.id, config)
		})),

	unregister: (id) =>
		set((state) => {
			const next = new Map(state.integrations);
			next.delete(id);
			return { integrations: next };
		}),

	reset: () => set({ integrations: new Map() })
}));
