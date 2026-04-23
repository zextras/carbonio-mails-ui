/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, PropsWithChildren, useEffect } from 'react';

import { useIsCarbonioCE } from '@zextras/carbonio-shell-ui';

import { addComponentsToShell } from 'app-utils/add-shell-components';
import { registerShellActions } from 'app-utils/register-shell-actions';
import { registerShellIntegrations } from 'app-utils/register-shell-integrations';
import { registerMockExternalAttachmentProvider } from 'dev-mocks/mock-external-attachment-provider';
import { registerMockPreviewSaveAttachmentProvider } from 'dev-mocks/mock-preview-save-attachment-provider';

export const ShellRegistrations: FC<PropsWithChildren> = ({ children }) => {
	const isCarbonioCE = useIsCarbonioCE();
	useEffect(() => {
		addComponentsToShell(isCarbonioCE);
		registerShellIntegrations();
		registerShellActions();
		registerMockExternalAttachmentProvider();
		registerMockPreviewSaveAttachmentProvider();
	}, [isCarbonioCE]);

	return <>{children}</>;
};
