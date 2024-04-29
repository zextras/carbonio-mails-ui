/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addSettingsView } from '@zextras/carbonio-shell-ui';
import { setupShellComponents } from '../setup-shell-components';
import { ProductFlavor } from '../../store/zustand/product-flavor/store';
import * as applyProductFlavourModule from '../../api/apply-product-flavour';

function mockApplyProductFlavourAPI(flavour: ProductFlavor): void {
	jest
		.spyOn(applyProductFlavourModule, 'applyProductFlavourAPI')
		.mockImplementation(() => Promise.resolve(flavour));
}

describe('setupShellComponents', () => {
	it('should not render Recover Messages menu item when ProductFlavour is community', async () => {
		mockApplyProductFlavourAPI('community');

		await setupShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'filters', label: 'filters.filters' }
				]
			})
		);
	});
	it('should render Recover Messages menu item when ProductFlavour is advanced ', async () => {
		mockApplyProductFlavourAPI('advanced');

		await setupShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'recover_messages', label: 'label.recover_messages' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'filters', label: 'filters.filters' }
				]
			})
		);
	});
});
