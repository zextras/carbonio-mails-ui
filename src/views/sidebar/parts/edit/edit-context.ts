/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext } from 'react';

export const Context = createContext<{
	setActiveGrant?: (arg: any) => void;
	activeModal?: string;
	setActiveModal?: (arg: string) => void;
	activeGrant?: any;
	onClose?: () => void;
}>({});
