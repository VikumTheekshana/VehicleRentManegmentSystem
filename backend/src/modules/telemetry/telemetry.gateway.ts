import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TelemetryService } from './telemetry.service';
import { FleetService } from '../fleet/fleet.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TelemetryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private intervalId: NodeJS.Timeout;

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly fleetService: FleetService,
  ) {}

  afterInit(server: Server) {
    console.log('📡 [Telemetry Gateway] WebSocket Server initialized on port 5000');
    // Start continuous telemetry broadcast every 3 seconds
    this.intervalId = setInterval(async () => {
      try {
        const packets = await this.telemetryService.generateMockTelemetry();
        this.server.emit('telemetry_update', packets);
      } catch (err) {
        // Silent recovery
      }
    }, 3000);
  }

  handleConnection(client: Socket) {
    console.log(`📡 [Telemetry Gateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`📡 [Telemetry Gateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('request_telemetry')
  async handleRequestTelemetry(client: Socket) {
    const packets = await this.telemetryService.generateMockTelemetry();
    client.emit('telemetry_update', packets);
  }

  @SubscribeMessage('toggle_engine_immobilizer')
  async handleImmobilizerCommand(@MessageBody() data: { vehicleId: string; immobilize: boolean }) {
    await this.fleetService.toggleImmobilizer(data.vehicleId, data.immobilize, {
      userId: 'WEBSOCKET_OPERATOR',
      email: 'operator@vms.local',
      role: 'FLEET_MANAGER',
    });
    this.server.emit('immobilizer_state_changed', data);
  }
}
