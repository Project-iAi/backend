import { CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";


@Entity()
export class ChatRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

}