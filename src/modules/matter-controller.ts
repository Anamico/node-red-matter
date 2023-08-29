import { CommissioningController } from '@project-chip/matter-node.js';
import {
  GeneralCommissioning,
  OnOffCluster,
} from '@project-chip/matter-node.js/cluster';
import { CommissioningOptions } from '@project-chip/matter-node.js/protocol';
import { ManualPairingCodeCodec } from '@project-chip/matter-node.js/schema';
import { logEndpoint } from '@project-chip/matter-node.js/util';

export class MatterController {
  commissioningController: CommissioningController;

  constructor(
    pairingCode: string,
    ip: string | undefined,
    port: number | undefined
  ) {
    const pairingCodeCodec = ManualPairingCodeCodec.decode(pairingCode);
    const shortDiscriminator = pairingCodeCodec.shortDiscriminator;
    const passcode = pairingCodeCodec.passcode;

    const commissioningOptions: CommissioningOptions = {
      regulatoryLocation:
        GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
      regulatoryCountryCode: 'XX',
    };

    const commissioningController = new CommissioningController({
      serverAddress:
        ip != null && port != null ? { ip, port, type: 'udp' } : undefined,
      longDiscriminator: undefined,
      shortDiscriminator,
      passcode,
      delayedPairing: true,
      commissioningOptions,
      subscribeAllAttributes: true,
    });

    logEndpoint(commissioningController.getRootEndpoint());

    this.commissioningController = commissioningController;
  }

  onStatusChange(onStatusChange: (status: boolean | undefined) => void) {
    const devices = this.commissioningController.getDevices();

    console.log('devices', devices.length);
    if (devices[0]) {
      const onOff = devices[0].getClusterClient(OnOffCluster);
      if (onOff !== undefined) {
        onOff.getOnOffAttribute().then((value) => {
          console.log('initial onOffStatus', value);
          onStatusChange(value);
        });

        onOff.addOnOffAttributeListener((value) => {
          console.log('updated onOffStatus', value);
          onStatusChange(value);
        });
      }
    }
  }
}
